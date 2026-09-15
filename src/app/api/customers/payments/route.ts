import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/services/customerService";
import { z } from "zod";

const DebtPaymentSchema = z.object({
  customerId: z.number().int(),
  amount: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0"),
  paymentMethod: z.string().default("CASH"),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = DebtPaymentSchema.parse(body);

    const result = await CustomerService.recordDebtPayment(validated);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
