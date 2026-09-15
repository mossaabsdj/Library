import { prisma } from "@/lib/prisma";
import { CheckoutInput } from "@/schemas/pos";
import { generateInvoiceNumber } from "@/lib/utils";
import { MovementType } from "@prisma/client";

export class SaleService {
  /**
   * Atomic Sale Checkout with stock verification, inventory movements, customer credit logging
   */
  static async checkout(data: CheckoutInput, allowNegativeStock?: boolean) {
    return prisma.$transaction(async (tx) => {
      let isNegativeAllowed = allowNegativeStock;
      if (isNegativeAllowed === undefined) {
        const setting = await tx.setting.findFirst({
          select: { allowNegativeStock: true },
        });
        isNegativeAllowed = Boolean(setting?.allowNegativeStock);
      }

      // 1. Verify stock availability for all items
      for (const item of data.items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, stockQuantity: true },
        });

        if (!prod) {
          throw new Error(`Produit introuvable (ID: ${item.productId})`);
        }

        if (!isNegativeAllowed && prod.stockQuantity < item.quantity) {
          throw new Error(
            `Stock insuffisant pour "${prod.name}". Disponible : ${prod.stockQuantity}, Demandé : ${item.quantity}`,
          );
        }
      }

      // 2. Compute remaining amount (customer debt)
      const remainingAmount = Math.max(0, data.finalAmount - data.paidAmount);

      if (remainingAmount > 0 && !data.customerId) {
        throw new Error(
          "Un client doit obligatoirement être sélectionné lorsqu'il y a un reste à payer (Vente à crédit) !",
        );
      }

      const invoiceNumber = generateInvoiceNumber("VNT");

      // 3. Create Sale record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          totalAmount: data.totalAmount,
          discountAmount: data.discountAmount || 0,
          taxAmount: data.taxAmount || 0,
          finalAmount: data.finalAmount,
          paidAmount: data.paidAmount,
          remainingAmount,
          paymentMethod: data.paymentMethod,
          status: "COMPLETED",
          customerId: data.customerId || null,
          notes: data.notes || null,
          cashierName: data.cashierName || "Admin",
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              unitPrice: item.unitPrice,
              purchasePrice: item.purchasePrice || 0,
              quantity: item.quantity,
              discount: item.discount || 0,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          customer: true,
        },
      });

      // 4. Update Product stock and create Inventory Movements
      for (const item of data.items) {
        const currentProd = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true },
        });
        const prevStock = currentProd?.stockQuantity || 0;
        const newStock = prevStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            previousStock: prevStock,
            newStock: newStock,
            type: MovementType.SALE,
            reference: invoiceNumber,
            user: data.cashierName || "Admin",
            notes: `Vente ${invoiceNumber}`,
          },
        });
      }

      // 5. Update customer credit/debt balance if credit sale
      if (remainingAmount > 0 && data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            credit: {
              increment: remainingAmount,
            },
          },
        });
      }

      // 6. Record payment if money was paid
      if (data.paidAmount > 0) {
        await tx.payment.create({
          data: {
            type: "SALE_PAYMENT",
            amount: data.paidAmount,
            paymentMethod: data.paymentMethod,
            saleId: sale.id,
            customerId: data.customerId || null,
            notes: `Paiement comptoir pour ${invoiceNumber}`,
          },
        });
      }

      return sale;
    });
  }

  /**
   * Process a sale return (retour vente)
   */
  static async processReturn(params: {
    saleId: number;
    itemsToReturn: { productId: number; quantity: number }[];
    reason?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: params.saleId },
        include: { items: true, customer: true },
      });

      if (!sale) throw new Error("Vente introuvable");

      let totalRefund = 0;

      for (const retItem of params.itemsToReturn) {
        const soldItem = sale.items.find(
          (i) => i.productId === retItem.productId,
        );
        if (!soldItem) continue;

        const qty = Math.min(soldItem.quantity, retItem.quantity);
        const refundAmount = Number(soldItem.unitPrice) * qty;
        totalRefund += refundAmount;

        // Restock product
        const prod = await tx.product.findUnique({
          where: { id: retItem.productId },
          select: { stockQuantity: true },
        });
        const prevStock = prod?.stockQuantity || 0;
        const newStock = prevStock + qty;

        await tx.product.update({
          where: { id: retItem.productId },
          data: { stockQuantity: newStock },
        });

        // Log movement
        await tx.inventoryMovement.create({
          data: {
            productId: retItem.productId,
            quantity: qty,
            previousStock: prevStock,
            newStock: newStock,
            type: MovementType.SALE_RETURN,
            reference: sale.invoiceNumber,
            notes: params.reason || "Retour client",
          },
        });
      }

      // Update sale status
      await tx.sale.update({
        where: { id: params.saleId },
        data: { status: "RETURNED" },
      });

      // If customer had credit on this sale, reduce customer credit
      if (sale.customerId && Number(sale.remainingAmount) > 0) {
        const reduction = Math.min(Number(sale.remainingAmount), totalRefund);
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            credit: {
              decrement: reduction,
            },
          },
        });
      }

      return { success: true, totalRefund };
    });
  }

  /**
   * Query sales history with pagination
   */
  static async getSales(params: {
    page?: number;
    limit?: number;
    customerId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.customerId) where.customerId = params.customerId;
    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = new Date(params.startDate);
      if (params.endDate) where.date.lte = new Date(params.endDate);
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          items: {
            include: { product: true },
          },
          customer: true,
          payments: true,
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return { sales, total, page, totalPages: Math.ceil(total / limit) };
  }
}
