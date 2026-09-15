import { z } from "zod";

const emptyStringToNull = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? null : val;

export const ProductSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1, "Product name is required"),
  primaryBarcode: z.preprocess(
    emptyStringToNull,
    z.string().nullable().optional(),
  ),
  reference: z.preprocess(emptyStringToNull, z.string().nullable().optional()),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  stockQuantity: z.coerce.number().int().default(0),
  purchasePrice: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? null : Number(val),
    z.number().min(0).nullable().optional(),
  ),
  salesRapid: z.boolean().default(false),
  image: z.preprocess(emptyStringToNull, z.string().nullable().optional()),
  category: z.preprocess(emptyStringToNull, z.string().nullable().optional()),

  // Extended fields
  minimumStock: z.coerce.number().int().default(5),
  description: z.preprocess(
    emptyStringToNull,
    z.string().nullable().optional(),
  ),
  unit: z.string().default("piece"),
  taxRate: z.coerce.number().default(0),
  discount: z.coerce.number().default(0),
  brand: z.preprocess(emptyStringToNull, z.string().nullable().optional()),
  supplierId: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? null : Number(val),
    z.number().int().nullable().optional(),
  ),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof ProductSchema>;

export const BarcodeSchema = z.object({
  id: z.number().int().optional(),
  productId: z.number().int().min(1, "Product ID is required"),
  code: z.string().min(1, "Barcode is required"),
});

export type BarcodeInput = z.infer<typeof BarcodeSchema>;
