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
   * Query sales history with advanced filters, search, pagination, and KPI aggregates
   */
  static async getSales(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentMethod?: string;
    customerId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    if (params.paymentMethod && params.paymentMethod !== "ALL") {
      where.paymentMethod = params.paymentMethod;
    }

    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) {
        where.date.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { cashierName: { contains: q } },
        { notes: { contains: q } },
        { customer: { fullName: { contains: q } } },
        { customer: { phone: { contains: q } } },
      ];
    }

    const [sales, total, aggregates] = await Promise.all([
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
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.sale.count({ where }),
      prisma.sale.aggregate({
        where,
        _sum: {
          totalAmount: true,
          discountAmount: true,
          taxAmount: true,
          finalAmount: true,
          paidAmount: true,
          remainingAmount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      sales,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      aggregates: {
        totalRevenue: Number(aggregates._sum.finalAmount || 0),
        totalPaid: Number(aggregates._sum.paidAmount || 0),
        totalRemaining: Number(aggregates._sum.remainingAmount || 0),
        totalCount: aggregates._count.id || total,
      },
    };
  }

  /**
   * Get single sale by ID with full item relations, customer, and payments
   */
  static async getById(id: number) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Update sale attributes (notes, customer assignment, status)
   * If customer changes and sale has remaining credit, debt balance is atomically transferred
   */
  static async updateSale(
    id: number,
    data: {
      customerId?: number | null;
      notes?: string | null;
      status?: string;
      cashierName?: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findUnique({
        where: { id },
      });
      if (!existing) throw new Error("Vente introuvable");

      const remaining = Number(existing.remainingAmount);

      // If customer changed and there is remaining debt, transfer the credit balance from old to new customer
      if (
        data.customerId !== undefined &&
        data.customerId !== existing.customerId &&
        remaining > 0
      ) {
        if (existing.customerId) {
          await tx.customer.update({
            where: { id: existing.customerId },
            data: { credit: { decrement: remaining } },
          });
        }
        if (data.customerId) {
          await tx.customer.update({
            where: { id: data.customerId },
            data: { credit: { increment: remaining } },
          });
        }
      }

      const updated = await tx.sale.update({
        where: { id },
        data: {
          ...(data.customerId !== undefined && { customerId: data.customerId }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.cashierName !== undefined && {
            cashierName: data.cashierName,
          }),
        },
        include: {
          items: {
            include: { product: true },
          },
          customer: true,
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return updated;
    });
  }

  /**
   * Record payment directly towards a sale's remaining credit
   */
  static async recordSalePayment(
    saleId: number,
    data: {
      amount: number;
      paymentMethod?: string;
      notes?: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
      });
      if (!sale) throw new Error("Vente introuvable");

      const currentRemaining = Number(sale.remainingAmount);
      if (currentRemaining <= 0) {
        throw new Error("Cette vente est déjà entièrement réglée.");
      }

      const paymentAmount = Math.min(data.amount, currentRemaining);
      const newRemaining = currentRemaining - paymentAmount;
      const newPaid = Number(sale.paidAmount) + paymentAmount;

      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          type: "SALE_PAYMENT",
          amount: paymentAmount,
          paymentMethod: data.paymentMethod || "CASH",
          saleId: sale.id,
          customerId: sale.customerId || null,
          notes: data.notes || `Règlement pour ${sale.invoiceNumber}`,
        },
      });

      // 2. Decrement customer debt if customer exists
      if (sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { credit: { decrement: paymentAmount } },
        });
      }

      // 3. Update Sale paid and remaining amounts
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
        },
        include: {
          items: { include: { product: true } },
          customer: true,
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return { payment, sale: updatedSale };
    });
  }
}
