import { NextRequest, NextResponse } from "next/server";
import { ImportExportService } from "@/services/importExportService";
import Papa from "papaparse";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const data = await ImportExportService.exportBarcodesData();

    if (format === "json") {
      return NextResponse.json(data);
    }

    const csv = Papa.unparse(data, {
      delimiter: ";",
      header: true,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="codes_barres_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
