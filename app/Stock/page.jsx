"use client";
//import TableItems from "@/app/component/TableItems/page";
import DataGrid from "@/app/component/DataGrid/DataGrid";

function Stock() {
  var title = "Stock";
  var columns = [
    "Produit_Nom",
    "Code_Barre",
    "Reference",
    "Prix_Unit",
    "Prix_Achat",
    "Quantite",
  ];
  var object = [
    {
      id: 1,
      Produit_Nom: "Gomma",
      Code_Barre: "1",
      Reference: "1",
      Nom: "a",
      Prix_Unit: "20.0",
      Prix_Achat: "10.0",
      Quantite: "20",
    },
    {
      id: 2,
      Produit_Nom: "Gomma",
      Code_Barre: "2",
      Reference: "2",
      Nom: "b",
      Prix_Unit: "20.0",
      Prix_Achat: "20.0",
      Quantite: "20",
    },
  ];
  return (
    <>
      <TableItems title={title} />
      <DataGrid columns={columns} rows={object} />
    </>
  );
}

export default Stock;
