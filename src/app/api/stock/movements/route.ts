import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/services/inventoryService";
import { MovementType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")
      ? parseInt(searchParams.get("productId")!, 10)
      : undefined;
    const type = (searchParams.get("type") as MovementType) || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const data = await InventoryService.getMovements({
      productId,
      type,
      page,
      limit,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
