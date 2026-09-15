import { NextResponse } from "next/server";
import { ProductService } from "@/services/productService";

export async function GET() {
  try {
    const categories = await ProductService.getCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
