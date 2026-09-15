import { NextResponse } from "next/server";
import { ReportService } from "@/services/reportService";

export async function GET() {
  try {
    const metrics = await ReportService.getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
