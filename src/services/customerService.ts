import { prisma } from "@/lib/prisma";
import { CustomerSchema } from "@/schemas/pos";
import { z } from "zod";

export class CustomerService {
  static async getCustomers(params?: {
    search?: string;
    withDebtOnly?: boolean;
  }) {
    const where: any = { isActive: true };

    if (params?.search) {
      const q = params.search.trim();
      where.OR = [{ fullName: { contains: q } }, { phone: { contains: q } }];
    }

    if (params?.withDebtOnly) {
      where.credit = { gt: 0 };
    }

    return prisma.customer.findMany({
      where,
      orderBy: { fullName: "asc" },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });
  }

  static async getById(id: number) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { date: "desc" },
          take: 20,
          include: { items: { include: { product: true } } },
        },
        payments: {
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });
  }

  static async createCustomer(data: z.infer<typeof CustomerSchema>) {
    return prisma.customer.create({
      data: {
        fullName: data.fullName,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
        creditLimit: data.creditLimit || 0,
      },
    });
  }

  static async updateCustomer(
    id: number,
    data: Partial<z.infer<typeof CustomerSchema>>,
  ) {
    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  static async recordDebtPayment(params: {
    customerId: number;
    amount: number;
    paymentMethod?: string;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: params.customerId },
      });

      if (!customer) throw new Error("Client introuvable");

      const updatedCustomer = await tx.customer.update({
        where: { id: params.customerId },
        data: {
          credit: {
            decrement: params.amount,
          },
        },
      });

      const payment = await tx.payment.create({
        data: {
          type: "CUSTOMER_DEBT_PAYMENT",
          amount: params.amount,
          paymentMethod: params.paymentMethod || "CASH",
          customerId: params.customerId,
          notes: params.notes || "Règlement dette client",
        },
      });

      return { customer: updatedCustomer, payment };
    });
  }
}
