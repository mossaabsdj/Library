import { NextRequest, NextResponse } from "next/server";
import { SaleService } from "@/services/saleService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const customerId = searchParams.get("customerId")
      ? parseInt(searchParams.get("customerId")!, 10)
      : undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await SaleService.getSales({
      page,
      limit,
      customerId,
      startDate,
      endDate,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
