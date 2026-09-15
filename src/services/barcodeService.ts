import { prisma } from "@/lib/prisma";

export class BarcodeService {
  static async getBarcodesByProductId(productId: number) {
    return prisma.barcode.findMany({
      where: { productId },
      orderBy: { id: "asc" },
    });
  }

  static async addBarcode(params: { productId: number; code: string }) {
    const trimmed = params.code.trim();
    if (!trimmed) throw new Error("Barcode cannot be empty");

    // Check if barcode already exists
    const existing = await prisma.barcode.findUnique({
      where: { code: trimmed },
      include: { product: { select: { id: true, name: true } } },
    });

    if (existing) {
      throw new Error(
        `Ce code-barres est déjà utilisé pour le produit "${existing.product.name}" (ID: ${existing.product.id})`,
      );
    }

    return prisma.barcode.create({
      data: {
        productId: params.productId,
        code: trimmed,
      },
    });
  }

  static async updateBarcode(id: number, newCode: string) {
    const trimmed = newCode.trim();
    if (!trimmed) throw new Error("Barcode cannot be empty");

    const existing = await prisma.barcode.findFirst({
      where: {
        code: trimmed,
        id: { not: id },
      },
    });

    if (existing) {
      throw new Error(`Ce code-barres existe déjà.`);
    }

    return prisma.barcode.update({
      where: { id },
      data: { code: trimmed },
    });
  }

  static async deleteBarcode(id: number) {
    return prisma.barcode.delete({
      where: { id },
    });
  }
}
