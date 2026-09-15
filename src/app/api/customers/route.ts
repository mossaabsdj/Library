import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "@/services/customerService";
import { CustomerSchema } from "@/schemas/pos";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const withDebtOnly = searchParams.get("withDebtOnly") === "true";

    const customers = await CustomerService.getCustomers({
      search,
      withDebtOnly,
    });
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CustomerSchema.parse(body);
    const customer = await CustomerService.createCustomer(validated);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
