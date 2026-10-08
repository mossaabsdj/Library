import { NextRequest, NextResponse } from "next/server";
import { SaleService } from "@/services/saleService";
import { z } from "zod";

const UpdateSaleSchema = z.object({
  customerId: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().optional(),
  cashierName: z.string().optional(),
});

const SalePaymentSchema = z.object({
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  paymentMethod: z.string().default("CASH"),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const sale = await SaleService.getById(numId);
    if (!sale) {
      return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const validated = UpdateSaleSchema.parse(body);

    const updated = await SaleService.updateSale(numId, validated);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const validated = SalePaymentSchema.parse(body);

    const result = await SaleService.recordSalePayment(numId, validated);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
