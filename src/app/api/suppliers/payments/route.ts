import { NextRequest, NextResponse } from "next/server";
import { PurchaseService } from "@/services/purchaseService";
import { z } from "zod";

const SupplierDebtPaymentSchema = z.object({
  supplierId: z.number().int(),
  amount: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0"),
  paymentMethod: z.string().default("CASH"),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SupplierDebtPaymentSchema.parse(body);

    const result = await PurchaseService.paySupplierDebt(validated);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
