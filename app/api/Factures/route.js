import {
  GetAll,
  Add_Facture,
  Update_Produit_Plus,
  Update_Produit_Moins,
  Get_Factprod_IDs_From_Fact,
  Delete_F_with_update,
  Delete_Facture_with_update,
  Update_Facture,
  Delete_FactProd,
  Delete_All_FactProd_with_update_Stock,
  deconecter,
  Get_Produit_ID_By_CodeBrarre,
  Add_FactProd,
} from "@/app/lib/bdd.mjs";
import { Console } from "console";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await GetAll("facture");
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching factures:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  } finally {
  }
}

export async function POST(request) {
  try {
    const { Montant_Total } = await request.json();
    const result = await Add_Facture(Montant_Total);
    return NextResponse.json({ message: "Facture added successfully", result });
  } catch (error) {
    console.error("Error adding Facture:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  } finally {
  }
}

export async function DELETE(request) {
  try {
    const { id, Facture_ID } = await request.json();

    let result;

    if (id) {
      return NextResponse.json({
        message: "All Factures non valider deleted successfully",
        result,
      });
    } else if (!id) {
      var result2 = await Delete_Facture_with_update(Facture_ID);
      return NextResponse.json({
        message: " Facture  deleted and  of Produis updated  successfully",
        result2,
      });
    } else {
      return NextResponse.json(
        { error: "Missing id or Facture_ID in the request body" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error deleting Facture:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}

// PUT to update a product by ID
export async function PUT(request) {
  try {
    const { Facture_ID, Montant_Total } = await request.json();
    await Delete_All_FactProd_with_update_Stock(Facture_ID);

    const result = await Update_Facture(Facture_ID, Montant_Total);
    return NextResponse.json({
      message: "Facture updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error updating Facture:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}

//add produits to facture
