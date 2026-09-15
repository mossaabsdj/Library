import { NextRequest, NextResponse } from "next/server";
import { BarcodeService } from "@/services/barcodeService";

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
    if (!body.code)
      return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const updated = await BarcodeService.updateBarcode(numId, body.code);
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

    await BarcodeService.deleteBarcode(numId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
