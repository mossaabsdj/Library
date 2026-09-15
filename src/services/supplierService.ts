import { prisma } from "@/lib/prisma";
import { SupplierSchema } from "@/schemas/pos";
import { z } from "zod";

export class SupplierService {
  static async getSuppliers(params?: { search?: string }) {
    const where: any = {};

    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q } },
        { company: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    return prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });
  }

  static async getById(id: number) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
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

  static async createSupplier(data: z.infer<typeof SupplierSchema>) {
    return prisma.supplier.create({
      data: {
        name: data.name,
        company: data.company || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
      },
    });
  }

  static async updateSupplier(
    id: number,
    data: Partial<z.infer<typeof SupplierSchema>>,
  ) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  }
}
