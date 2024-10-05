import {
  GetAll,
  Add_Produit,
  Delete_Produit,
  GetAllProducts_with_All_CodeBarres,
  Update_Produit,
  deconecter,
} from "@/app/lib/bdd.mjs";
import { Console } from "console";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await GetAllProducts_with_All_CodeBarres();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  } finally {
  }
}

export async function POST(request) {
  try {
    const { Code_Barres, Nom, Refference, Prix_Unit } = await request.json();
    const result = await Add_Produit(Code_Barres, Nom, Refference, Prix_Unit);

    return NextResponse.json({ message: "Product added successfully", result });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  } finally {
  }
}
export async function DELETE(request) {
  try {
    // Read and parse the JSON body from the request
    const { Produit_ID } = await request.json(); // Change to .json() to get the body content

    if (!Produit_ID) {
      return NextResponse.json(
        { error: "Produit_ID is required" },
        { status: 400 }
      );
    }

    const result = await Delete_Produit(Produit_ID);
    return NextResponse.json({
      message: "Product deleted successfully",
      result,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}

// PUT to update a product by ID
export async function PUT(request) {
  try {
    const {
      Code_Barres,
      Refference,
      Nom,
      Prix_Unit,
      Produit_ID,
      Sales_Rapid,
      Image,
    } = await request.json();
    const result = await Update_Produit(
      Code_Barres,
      Refference,
      Nom,
      Prix_Unit,
      Produit_ID,
      Sales_Rapid,
      Image
    );
    return NextResponse.json({
      message: "Product updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
