import { prisma } from "@/lib/prisma";
import { CreatePurchaseSchema } from "@/schemas/pos";
import { z } from "zod";
import { MovementType } from "@prisma/client";

export class PurchaseService {
  /**
   * Create a purchase invoice, increment stock, create PURCHASE movements, update supplier debt
   */
  static async createPurchase(data: z.infer<typeof CreatePurchaseSchema>) {
    return prisma.$transaction(async (tx) => {
      const remainingAmount = Math.max(0, data.totalAmount - data.paidAmount);
      const paymentStatus =
        remainingAmount === 0
          ? "PAID"
          : data.paidAmount > 0
            ? "PARTIAL"
            : "UNPAID";

      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          date: data.date ? new Date(data.date) : new Date(),
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          remainingAmount,
          paymentStatus,
          supplierId: data.supplierId,
          notes: data.notes || null,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              purchasePrice: item.purchasePrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          supplier: true,
        },
      });

      // 2. Increment stock and create Inventory Movements for each item
      for (const item of data.items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true, purchasePrice: true },
        });

        const prevStock = prod?.stockQuantity || 0;
        const newStock = prevStock + item.quantity;

        // Update product stock and last purchase price
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: newStock,
            purchasePrice: item.purchasePrice,
          },
        });

        // Inventory audit trail
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            previousStock: prevStock,
            newStock: newStock,
            type: MovementType.PURCHASE,
            reference: data.invoiceNumber,
            notes: `Achat Fournisseur ${data.invoiceNumber}`,
          },
        });
      }

      // 3. Update Supplier debt if remainingAmount > 0
      if (remainingAmount > 0) {
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: {
            debt: {
              increment: remainingAmount,
            },
          },
        });
      }

      // 4. Record payment if paidAmount > 0
      if (data.paidAmount > 0) {
        await tx.payment.create({
          data: {
            type: "PURCHASE_PAYMENT",
            amount: data.paidAmount,
            paymentMethod: "CASH",
            purchaseId: purchase.id,
            supplierId: data.supplierId,
            notes: `Règlement achat ${data.invoiceNumber}`,
          },
        });
      }

      return purchase;
    });
  }

  /**
   * Pay supplier debt (versment fournisseur)
   */
  static async paySupplierDebt(params: {
    supplierId: number;
    amount: number;
    paymentMethod?: string;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({
        where: { id: params.supplierId },
      });

      if (!supplier) throw new Error("Fournisseur introuvable");

      // Decrement supplier debt
      const updatedSupplier = await tx.supplier.update({
        where: { id: params.supplierId },
        data: {
          debt: {
            decrement: params.amount,
          },
        },
      });

      // Log payment
      const payment = await tx.payment.create({
        data: {
          type: "SUPPLIER_DEBT_PAYMENT",
          amount: params.amount,
          paymentMethod: params.paymentMethod || "CASH",
          supplierId: params.supplierId,
          notes:
            params.notes || "Versement pour règlement de dette fournisseur",
        },
      });

      return { supplier: updatedSupplier, payment };
    });
  }

  /**
   * Query purchases
   */
  static async getPurchases(params: {
    supplierId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.supplierId) where.supplierId = params.supplierId;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          supplier: true,
          items: {
            include: { product: true },
          },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    return { purchases, total, page, totalPages: Math.ceil(total / limit) };
  }
}
