import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ProductInput } from "@/schemas/product";
import { InventoryService } from "./inventoryService";
import { MovementType } from "@prisma/client";
import { ImageStorageService } from "./imageStorageService";

export class ProductService {
  /**
   * Fast barcode lookup for POS scanning.
   * Resolves barcodes against both normalized Barcode table and Product.primaryBarcode.
   */
  static async findByBarcode(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return null;

    // 1. Look up in Barcode table
    const barcodeRecord = await prisma.barcode.findUnique({
      where: { code: trimmed },
      include: {
        product: {
          include: {
            barcodes: true,
          },
        },
      },
    });

    if (barcodeRecord && barcodeRecord.product) {
      return barcodeRecord.product;
    }

    // 2. Look up in Product table primary barcode compatibility field
    const productRecord = await prisma.product.findUnique({
      where: { primaryBarcode: trimmed },
      include: {
        barcodes: true,
      },
    });

    if (productRecord) {
      // Intelligently ensure barcode exists in Barcode table without duplicate key errors
      try {
        await prisma.barcode.upsert({
          where: { code: trimmed },
          update: { productId: productRecord.id },
          create: {
            productId: productRecord.id,
            code: trimmed,
          },
        });
      } catch {
        // Safe ignore
      }
      return productRecord;
    }

    return null;
  }

  /**
   * Query products with server-side pagination, filters and search
   */
  static async getProducts(params: {
    search?: string;
    category?: string;
    salesRapid?: boolean;
    stockStatus?: "all" | "inStock" | "lowStock" | "outOfStock";
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (params.category && params.category !== "all") {
      where.category = params.category;
    }

    if (params.salesRapid !== undefined) {
      where.salesRapid = params.salesRapid;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q } },
        { reference: { contains: q } },
        { primaryBarcode: { contains: q } },
        {
          barcodes: {
            some: {
              code: { contains: q },
            },
          },
        },
      ];
    }

    if (params.stockStatus) {
      if (params.stockStatus === "outOfStock") {
        where.stockQuantity = { lte: 0 };
      } else if (params.stockStatus === "lowStock") {
        where.AND = [
          { stockQuantity: { gt: 0 } },
          { stockQuantity: { lte: 5 } }, // Or dynamically compared to minimumStock
        ];
      } else if (params.stockStatus === "inStock") {
        where.stockQuantity = { gt: 5 };
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ salesRapid: "desc" }, { name: "asc" }],
        skip,
        take: limit,
        include: {
          barcodes: true,
          supplier: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all distinct categories
   */
  static async getCategories(): Promise<string[]> {
    const categories = await prisma.product.findMany({
      where: {
        category: { not: null },
        isActive: true,
      },
      select: { category: true },
      distinct: ["category"],
    });

    return categories
      .map((c) => c.category)
      .filter((c): c is string =>
        Boolean(c && c.trim().length > 0 && c !== "?"),
      );
  }

  /**
   * Get product by ID with all relations
   */
  static async getById(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        barcodes: true,
        supplier: true,
        inventoryMovements: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
  }

  /**
   * Create a new product with barcode resolution and initial stock tracking
   */
  static async createProduct(data: ProductInput) {
    return prisma.$transaction(async (tx) => {
      // Check if primary barcode conflicts with existing barcode
      if (data.primaryBarcode && data.primaryBarcode.trim()) {
        const barcodeTrimmed = data.primaryBarcode.trim();
        const existingBarcode = await tx.barcode.findUnique({
          where: { code: barcodeTrimmed },
        });
        if (existingBarcode) {
          throw new Error(
            `Barcode '${barcodeTrimmed}' is already assigned to another product.`,
          );
        }
      }

      const product = await tx.product.create({
        data: {
          name: data.name,
          primaryBarcode: data.primaryBarcode
            ? data.primaryBarcode.trim()
            : null,
          reference: data.reference ? data.reference.trim() : null,
          unitPrice: data.unitPrice,
          stockQuantity: data.stockQuantity || 0,
          purchasePrice:
            data.purchasePrice !== undefined ? data.purchasePrice : null,
          salesRapid: data.salesRapid || false,
          image: data.image || null,
          category: data.category || null,
          minimumStock: data.minimumStock || 5,
          description: data.description || null,
          unit: data.unit || "piece",
          taxRate: data.taxRate || 0,
          discount: data.discount || 0,
          brand: data.brand || null,
          supplierId: data.supplierId || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });

      // Automatically register in Barcode table
      if (product.primaryBarcode) {
        await tx.barcode.create({
          data: {
            productId: product.id,
            code: product.primaryBarcode,
          },
        });
      }

      // Record initial stock if stockQuantity > 0
      if (product.stockQuantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            quantity: product.stockQuantity,
            previousStock: 0,
            newStock: product.stockQuantity,
            type: MovementType.INITIAL_STOCK,
            reference: "INIT-CREATE",
            notes: "Initial inventory setup",
          },
        });
      }

      return product;
    });
  }

  /**
   * Update product and synchronize primary barcode
   */
  static async updateProduct(id: number, data: Partial<ProductInput>) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`Product with ID ${id} not found`);
      }

      const newBarcode =
        data.primaryBarcode !== undefined
          ? data.primaryBarcode?.trim() || null
          : existing.primaryBarcode;

      // If barcode changed, check uniqueness
      if (newBarcode && newBarcode !== existing.primaryBarcode) {
        const conflict = await tx.barcode.findFirst({
          where: {
            code: newBarcode,
            productId: { not: id },
          },
        });
        if (conflict) {
          throw new Error(
            `Barcode '${newBarcode}' is already assigned to another product.`,
          );
        }
      }

      // Detect manual stock adjustment if stockQuantity passed directly
      if (
        data.stockQuantity !== undefined &&
        data.stockQuantity !== existing.stockQuantity
      ) {
        const diff = data.stockQuantity - existing.stockQuantity;
        await tx.inventoryMovement.create({
          data: {
            productId: id,
            quantity: Math.abs(diff),
            previousStock: existing.stockQuantity,
            newStock: data.stockQuantity,
            type:
              diff > 0
                ? MovementType.ADJUSTMENT_IN
                : MovementType.ADJUSTMENT_OUT,
            reference: "MANUAL-UPDATE",
            notes: "Direct stock quantity adjustment in product edit",
          },
        });
      }

      // Automatically clean up old image if being replaced or removed
      if (
        data.image !== undefined &&
        data.image !== existing.image &&
        existing.image
      ) {
        await ImageStorageService.deleteImage(existing.image);
      }

      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.primaryBarcode !== undefined && {
            primaryBarcode: newBarcode,
          }),
          ...(data.reference !== undefined && { reference: data.reference }),
          ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
          ...(data.stockQuantity !== undefined && {
            stockQuantity: data.stockQuantity,
          }),
          ...(data.purchasePrice !== undefined && {
            purchasePrice: data.purchasePrice,
          }),
          ...(data.salesRapid !== undefined && { salesRapid: data.salesRapid }),
          ...(data.image !== undefined && { image: data.image }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.minimumStock !== undefined && {
            minimumStock: data.minimumStock,
          }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.unit !== undefined && { unit: data.unit }),
          ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
          ...(data.discount !== undefined && { discount: data.discount }),
          ...(data.brand !== undefined && { brand: data.brand }),
          ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          barcodes: true,
        },
      });

      // Ensure barcode in Barcode table
      if (newBarcode) {
        await tx.barcode.upsert({
          where: { code: newBarcode },
          update: { productId: id },
          create: { productId: id, code: newBarcode },
        });
      }

      return updated;
    });
  }

  /**
   * Delete product and clean up associated image file if local
   */
  static async deleteProduct(id: number) {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { image: true },
    });

    const deleted = await prisma.product.delete({
      where: { id },
    });

    if (existing?.image) {
      await ImageStorageService.deleteImage(existing.image);
    }

    return deleted;
  }
}
