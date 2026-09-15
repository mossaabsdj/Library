import { NextRequest, NextResponse } from "next/server";
import { BarcodeService } from "@/services/barcodeService";
import { BarcodeSchema } from "@/schemas/product";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = BarcodeSchema.parse(body);
    const barcode = await BarcodeService.addBarcode({
      productId: validated.productId,
      code: validated.code,
    });
    return NextResponse.json(barcode, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
