import { NextRequest, NextResponse } from "next/server";
import { SaleService } from "@/services/saleService";
import { CheckoutSchema } from "@/schemas/pos";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CheckoutSchema.parse(body);

    const sale = await SaleService.checkout(validated);
    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
