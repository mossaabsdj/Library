import { prisma } from "@/lib/prisma";
import { MovementType, Prisma } from "@prisma/client";

export class InventoryService {
  /**
   * Mutate stock atomically and log an inventory movement audit trail
   */
  static async recordMovement(
    params: {
      productId: number;
      quantityChange: number; // positive to add stock, negative to reduce stock
      type: MovementType;
      reference?: string;
      user?: string;
      notes?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;

    const product = await client.product.findUnique({
      where: { id: params.productId },
      select: { id: true, stockQuantity: true, name: true },
    });

    if (!product) {
      throw new Error(`Product with ID ${params.productId} not found`);
    }

    const previousStock = product.stockQuantity;
    const newStock = previousStock + params.quantityChange;

    // Update product stock
    await client.product.update({
      where: { id: params.productId },
      data: { stockQuantity: newStock },
    });

    // Record audit movement
    const movement = await client.inventoryMovement.create({
      data: {
        productId: params.productId,
        quantity: Math.abs(params.quantityChange),
        previousStock,
        newStock,
        type: params.type,
        reference: params.reference || null,
        user: params.user || "Admin",
        notes: params.notes || null,
      },
    });

    return { product, movement, previousStock, newStock };
  }

  /**
   * Manual inventory adjustment (e.g. inventory audit, lost/broken items, corrections)
   */
  static async adjustStock(params: {
    productId: number;
    adjustmentQuantity: number; // e.g. +5 or -3
    reason: string;
    user?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const type: MovementType =
        params.adjustmentQuantity >= 0
          ? MovementType.ADJUSTMENT_IN
          : MovementType.ADJUSTMENT_OUT;

      return this.recordMovement(
        {
          productId: params.productId,
          quantityChange: params.adjustmentQuantity,
          type,
          reference: "MANUAL-ADJ",
          user: params.user || "Admin",
          notes: params.reason,
        },
        tx,
      );
    });
  }

  /**
   * Retrieve paginated inventory movements
   */
  static async getMovements(params: {
    productId?: number;
    type?: MovementType;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryMovementWhereInput = {};
    if (params.productId) where.productId = params.productId;
    if (params.type) where.type = params.type;

    const [items, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              reference: true,
              primaryBarcode: true,
              category: true,
            },
          },
        },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }
}
