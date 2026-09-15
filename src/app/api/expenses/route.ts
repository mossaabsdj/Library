import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExpenseSchema } from "@/schemas/pos";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const where: any = {};
    if (category) where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ExpenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        title: validated.title,
        category: validated.category,
        amount: validated.amount,
        paymentMethod: validated.paymentMethod || "CASH",
        notes: validated.notes || null,
        date: validated.date ? new Date(validated.date) : new Date(),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
