import { NextRequest, NextResponse } from "next/server";
import { PurchaseService } from "@/services/purchaseService";
import { CreatePurchaseSchema } from "@/schemas/pos";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const supplierId = searchParams.get("supplierId")
      ? parseInt(searchParams.get("supplierId")!, 10)
      : undefined;

    const data = await PurchaseService.getPurchases({
      page,
      limit,
      supplierId,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreatePurchaseSchema.parse(body);

    const purchase = await PurchaseService.createPurchase(validated);
    return NextResponse.json(purchase, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
