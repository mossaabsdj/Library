import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services/productService";
import { ProductSchema } from "@/schemas/product";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const salesRapid = searchParams.has("salesRapid")
      ? searchParams.get("salesRapid") === "true"
      : undefined;
    const stockStatus = (searchParams.get("stockStatus") as any) || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const data = await ProductService.getProducts({
      search,
      category,
      salesRapid,
      stockStatus,
      page,
      limit,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ProductSchema.parse(body);
    const product = await ProductService.createProduct(validated);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
