import { NextResponse } from "next/server";
import { ImportExportService } from "@/services/importExportService";

export async function POST() {
  try {
    const result = await ImportExportService.importFromLabrary1Database();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
