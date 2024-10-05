import {
  GetAll,
  Add_Vente,
  Delete_Vente_with_update,
  Update_Vente,
  Delete_All_VentProd_with_update_Stock,
  Get_Ventprod_IDs_From_Vent,
  GetAllProducts,
  Delete_VentProd,
  deconecter,
} from "@/app/lib/bdd.mjs";
import { Console } from "console";

import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url); // Create a URL object from the request URL
  const All = url.searchParams.get("All"); // Get the query parameter
  if (All) {
    try {
      const products = await GetAllProducts();
      return NextResponse.json(products);
    } catch (error) {
      console.error("Error fetching Products:", error);
      return NextResponse.json({ error: error.toString() }, { status: 500 });
    }
  } else {
    try {
      const products = await GetAll("vente");
      return NextResponse.json(products);
    } catch (error) {
      console.error("Error fetching vente:", error);
      return NextResponse.json({ error: error.toString() }, { status: 500 });
    }
  }
}

export async function POST(request) {
  try {
    const { Montant_Total } = await request.json();
    const result = await Add_Vente(Montant_Total);
    return NextResponse.json({ message: "vente added successfully", result });
  } catch (error) {
    console.error("Error adding vente:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  } finally {
  }
}

// PUT to update a product by ID
export async function PUT(request) {
  try {
    const { Sales_ID, Montant_Total } = await request.json();
    const results = await Delete_All_VentProd_with_update_Stock(Sales_ID);
    const result = await Update_Vente(Sales_ID, Montant_Total);

    return NextResponse.json({
      message: "Vente updated successfully",
      results,
    });
  } catch (error) {
    console.error("Error updating Vente:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}

//Delete Vente
export async function DELETE(request) {
  try {
    // Read and parse the JSON body from the request
    const { id, Sales_ID } = await request.json(); // Parse the request body once

    let result;

    if (id) {
      //  result = await Delete_Sales_NonValider();

      return NextResponse.json({
        message: "All Sales non valider deleted successfully",
        result,
      });
    } else if (Sales_ID) {
      result = await Delete_Vente_with_update(Sales_ID);
      return NextResponse.json({
        message: "Sales deleted and produit stock updated successfully",
        result,
      });
    } else {
      return NextResponse.json(
        { error: "Missing id or Sales_ID in the request body" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error deleting Sales:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
