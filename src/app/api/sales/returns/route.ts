import { NextRequest, NextResponse } from "next/server";
import { SaleService } from "@/services/saleService";
import { z } from "zod";

const ReturnSchema = z.object({
  saleId: z.number().int(),
  itemsToReturn: z
    .array(
      z.object({
        productId: z.number().int(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ReturnSchema.parse(body);

    const result = await SaleService.processReturn(validated);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
