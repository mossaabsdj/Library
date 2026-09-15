import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/services/customerService";
import { CustomerSchema } from "@/schemas/pos";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const customer = await CustomerService.getById(numId);
    if (!customer)
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );

    return NextResponse.json(customer);
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
    const validated = CustomerSchema.partial().parse(body);
    const updated = await CustomerService.updateCustomer(numId, validated);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
