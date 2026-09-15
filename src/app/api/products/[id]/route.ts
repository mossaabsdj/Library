import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/productService";
import { ProductSchema } from "@/schemas/product";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const product = await ProductService.getById(numId);
    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json(product);
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
    const validated = ProductSchema.partial().parse(body);
    const updated = await ProductService.updateProduct(numId, validated);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await ProductService.deleteProduct(numId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
