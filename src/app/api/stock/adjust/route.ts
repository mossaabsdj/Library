import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/services/inventoryService";
import { StockAdjustmentSchema } from "@/schemas/pos";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = StockAdjustmentSchema.parse(body);

    const result = await InventoryService.adjustStock(validated);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
