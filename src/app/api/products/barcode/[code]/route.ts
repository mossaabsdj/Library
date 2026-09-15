import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/productService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json(
        { error: "Barcode is required" },
        { status: 400 },
      );
    }

    const product = await ProductService.findByBarcode(
      decodeURIComponent(code),
    );
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
