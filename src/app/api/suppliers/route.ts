import { NextRequest, NextResponse } from "next/server";
import { SupplierService } from "@/services/supplierService";
import { SupplierSchema } from "@/schemas/pos";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const suppliers = await SupplierService.getSuppliers({ search });
    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SupplierSchema.parse(body);
    const supplier = await SupplierService.createSupplier(validated);
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
