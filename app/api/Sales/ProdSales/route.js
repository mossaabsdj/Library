import {
  Get_Produit_ID_By_CodeBrarre,
  Get_Produit_By_CodeBrarre,
  Delete_Vent_Prod_Update_Facture,
  Delete_VentProd_with_update,
  Get_Produit_Prix_Vente_By_id,
  Get_Sales_Produits,
  Add_VentProd,
  Get_Product_By_CodeBarre,
} from "@/app/lib/bdd.mjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { Sales_ID, Produit_ID, Prix_Vente, Quantite } = await request.json();

    const result = await Add_VentProd(
      Sales_ID,
      Produit_ID,
      Prix_Vente,
      Quantite
    );

    return NextResponse.json({
      message: "Produits added to Sales successfully",
      result,
    });
  } catch (error) {
    console.error("Error adding Produits to Sales:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}

export async function GET(request) {
  const url = new URL(request.url); // Create a URL object from the request URL
  const Code_Barre = url.searchParams.get("Code_Barre"); // Get the query parameter

  if (!Code_Barre) {
    try {
      const Sales_ID = url.searchParams.get("Sales_ID"); // Get the query parameter
      const R = await Get_Sales_Produits(Sales_ID);
      return NextResponse.json(R);
    } catch (error) {
      console.error("Error fetching history:", error);
      return NextResponse.json({ error: error.toString() }, { status: 500 });
    }
  } else {
    try {
      const products = await Get_Product_By_CodeBarre(Code_Barre);

      return NextResponse.json(products);
    } catch (error) {
      console.error("Error fetching Sales:", error);
      return NextResponse.json({ error: error.toString() }, { status: 500 });
    }
  }
}

export async function DELETE(request) {
  try {
    // Read and parse the JSON body from the request
    const { SalesProd_ID, SalesProd_ID2 } = await request.json(); // Change to .json() to get the body content
    if (SalesProd_ID2) {
      const res = await Delete_Vent_Prod_Update_Facture(SalesProd_ID2);

      return NextResponse.json({
        message: " deleted product From Sales and update montant successfully",
        res,
      });
    } else {
      if (!SalesProd_ID) {
        return NextResponse.json(
          { error: "SalesProd_ID is required" },
          { status: 400 }
        );
      }

      const result = await Delete_VentProd_with_update(SalesProd_ID);
      return NextResponse.json({
        message: "Product deleted product From Sales successfully",
        result,
      });
    }
  } catch (error) {
    console.error("Error deleting product from Sales:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
