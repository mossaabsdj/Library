import { NextRequest, NextResponse } from "next/server";
import { ImportExportService } from "@/services/importExportService";

export async function POST(request: NextRequest) {
  try {
    const { type, rows, strategy } = await request.json();

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Invalid rows data" }, { status: 400 });
    }

    if (type === "barcode") {
      const result = await ImportExportService.executeBarcodeImport(
        rows,
        strategy,
      );
      return NextResponse.json(result);
    } else {
      const result = await ImportExportService.executeProductImport(
        rows,
        strategy,
      );
      return NextResponse.json(result);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
