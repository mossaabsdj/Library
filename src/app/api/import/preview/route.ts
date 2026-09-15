import { NextRequest, NextResponse } from "next/server";
import { ImportExportService } from "@/services/importExportService";

export async function POST(request: NextRequest) {
  try {
    const { type, rows } = await request.json();

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Invalid rows data" }, { status: 400 });
    }

    if (type === "barcode") {
      const preview = await ImportExportService.previewBarcodeImport(rows);
      return NextResponse.json(preview);
    } else {
      const preview = await ImportExportService.previewProductImport(rows);
      return NextResponse.json(preview);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
