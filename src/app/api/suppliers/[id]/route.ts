import { NextRequest, NextResponse } from "next/server";
import { SupplierService } from "@/services/supplierService";
import { SupplierSchema } from "@/schemas/pos";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const supplier = await SupplierService.getById(numId);
    if (!supplier)
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 },
      );

    return NextResponse.json(supplier);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await request.json();
    const validated = SupplierSchema.partial().parse(body);
    const updated = await SupplierService.updateSupplier(numId, validated);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
