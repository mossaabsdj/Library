import { z } from "zod";

export const CartItemSchema = z.object({
  productId: z.number().int(),
  name: z.string().default("Produit"),
  reference: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  unitPrice: z.number().min(0),
  purchasePrice: z.number().min(0).default(0),
  quantity: z.number().int().min(1),
  maxStock: z.number().int().default(0),
  discount: z.number().min(0).default(0),
  subtotal: z.number().min(0).default(0),
  image: z.string().nullable().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart cannot be empty"),
  totalAmount: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  finalAmount: z.number().min(0),
  paidAmount: z.number().min(0),
  paymentMethod: z.enum(["CASH", "CARD", "CREDIT", "OTHER"]),
  customerId: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  cashierName: z.string().default("Admin"),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

export const CustomerSchema = z.object({
  id: z.number().int().optional(),
  fullName: z.string().min(1, "Customer name is required"),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  address: z.string().nullable().optional(),
  creditLimit: z.coerce.number().min(0).default(0),
  notes: z.string().nullable().optional(),
});

export const SupplierSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1, "Supplier name is required"),
  company: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const PurchaseItemSchema = z.object({
  productId: z.number().int(),
  purchasePrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(1),
  subtotal: z.coerce.number().min(0),
});

export const CreatePurchaseSchema = z.object({
  supplierId: z.number().int(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.string().optional(),
  totalAmount: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0),
  items: z.array(PurchaseItemSchema).min(1, "At least one item is required"),
  notes: z.string().nullable().optional(),
});

export const StockAdjustmentSchema = z.object({
  productId: z.number().int(),
  adjustmentQuantity: z.number().int(), // Positive or negative
  reason: z.string().min(1, "Adjustment reason is mandatory"),
});

export const ExpenseSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().min(1, "Title is required"),
  category: z.enum([
    "RENT",
    "ELECTRICITY",
    "TRANSPORT",
    "SALARY",
    "MAINTENANCE",
    "SUPPLIES",
    "OTHER",
  ]),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().default("CASH"),
  notes: z.string().nullable().optional(),
  date: z.string().optional(),
});
