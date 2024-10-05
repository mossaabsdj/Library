import {
  Get_Product_By_CodeBarre,
  Delete_Fact_Prod_Update_Facture,
  Delete_FactProd_with_update,
  Get_Facture_Produits,
  Add_FactProd,
} from "@/app/lib/bdd.mjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { Facture_ID, Produit_ID, PrixAchat, Quantite } =
      await request.json();
    const result = await Add_FactProd(
      Facture_ID,
      Produit_ID,
      PrixAchat,
      Quantite
    );
    return NextResponse.json({
      message: "Produits added to Facture successfully",
      result,
    });
  } catch (error) {
    console.error("Error adding Produits to Facture:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
export async function GET(request) {
  const url = new URL(request.url); // Create a URL object from the request URL
  const Code_Barre = url.searchParams.get("Code_Barre"); // Get the query parameter

  if (!Code_Barre) {
    try {
      const Facture_ID = url.searchParams.get("Facture_ID"); // Get the query parameter
      const R = await Get_Facture_Produits(Facture_ID);
      return NextResponse.json(R);
    } catch (error) {
      console.error("Error fetching history:", error);
      return NextResponse.json({ error: error.toString() }, { status: 500 });
    }
  } else {
    try {
      const product = await Get_Product_By_CodeBarre(Code_Barre);

      return NextResponse.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      return NextResponse.json({ error: error.toString() }, { status: 500 });
    }
  }
}
export async function DELETE(request) {
  try {
    // Read and parse the JSON body from the request
    const { FactProd_ID, FactProd_ID2 } = await request.json(); // Change to .json() to get the body content
    if (FactProd_ID2) {
      const res = await Delete_Fact_Prod_Update_Facture(FactProd_ID2);
      return NextResponse.json({
        message: " deleted product From fact and update montant successfully",
        res,
      });
    } else {
      if (!FactProd_ID) {
        return NextResponse.json(
          { error: "FactProd_ID is required" },
          { status: 400 }
        );
      }

      const result = await Delete_FactProd_with_update(FactProd_ID);
      return NextResponse.json({
        message: " deleted product From fact successfully",
        result,
      });
    }
  } catch (error) {
    console.error("Error deleting product from fact:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
