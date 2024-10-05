import { Get_Products_Sales_Rapid } from "@/app/lib/bdd.mjs";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const R = await Get_Products_Sales_Rapid();
    return NextResponse.json(R);
  } catch (error) {
    console.error("Error fetching Products Sales Rapid:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
