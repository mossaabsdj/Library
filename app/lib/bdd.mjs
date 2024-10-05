import { Console } from "console";
import mysql from "mysql";
import { Await } from "react-router-dom";
import { json } from "stream/consumers";

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "labrary1",
});

con.connect((error) => {
  if (error) {
    console.error("Error connecting to the database:", error);
  } else {
    console.log("Database connection established.");
  }
});

function deconecter() {
  con.end((error) => {
    if (error) {
      console.error("Error closing the connection:", error);
    }
    console.log("Connection closed.");
  });
}
//Get-------------------------------------------------------------------------------------
function GetAll(TableName) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT * FROM " + mysql.escapeId(TableName),
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}
async function GetAllProducts() {
  const produits = await GetAll("produit");
  for (let prod of produits) {
    var code_Barres_List = [];
    var Code_Barres = await Get_code_Barres_By_Produit_ID(prod.Produit_ID);
    if (Code_Barres && Code_Barres.length > 0) {
      for (let code_Barre of Code_Barres) {
        code_Barres_List.push(code_Barre);
      }
      prod.Code_Barre = code_Barres_List[0].Code_Barre;
    } else {
      prod.Code_Barre = null; // or handle it in another way if needed
    }
  }
  return produits;
}
async function GetAllProducts_with_All_CodeBarres() {
  const produits = await GetAll("produit");
  for (let prod of produits) {
    var code_Barres_List = [];
    var Code_Barres = await Get_code_Barres_By_Produit_ID(prod.Produit_ID);
    if (Code_Barres && Code_Barres.length > 0) {
      for (let code_Barre of Code_Barres) {
        code_Barres_List.push(code_Barre);
      }
      prod.Code_Barre = code_Barres_List;
    } else {
      prod.Code_Barre = null; // or handle it in another way if needed
    }
  }
  return produits;
}

function Get_code_Barres_By_Produit_ID(Produit_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT Code_Barre FROM code_Barres where Produit_ID=?",
      Produit_ID,

      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_All_Code_Bare_and_Produit_ID() {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT Code_Barre,Produit_ID FROM produit ",
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_Products(Nom) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT * FROM produit WHERE Nom LIKE ? ",
      Nom,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}
async function Get_Products_Sales_Rapid() {
  const produits = await Get_Products_Sales_Rapid_1();
  for (let prod of produits) {
    var code_Barres_List = [];
    var Code_Barres = await Get_code_Barres_By_Produit_ID(prod.Produit_ID);
    if (Code_Barres && Code_Barres.length > 0) {
      for (let code_Barre of Code_Barres) {
        code_Barres_List.push(code_Barre);
      }
      prod.Code_Barre = code_Barres_List[0].Code_Barre;
    } else {
      prod.Code_Barre = null; // or handle it in another way if needed
    }
  }
  return produits;
}

function Get_Products_Sales_Rapid_1() {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT * FROM produit WHERE Sales_Rapid = 1 ",

      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_Facture_NonValider() {
  return new Promise((resolve, reject) => {
    con.query(
      "Select Facture_ID FROM facture WHERE Montant_Total IS NULL OR Montant_Total = 0",

      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function GetSum_Vente() {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT    SUM(Montant_Total) AS total_sales FROM vente ; ",
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function GetSum_fact() {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT    SUM(Montant_Total) AS total_achat FROM facture ; ",
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function GetVente_Stat() {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT  DATE(Date) AS sale_date,  SUM(Montant_Total) AS total_sales FROM vente GROUP BY DATE(Date)ORDER BY sale_date; ",
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_Sales_Produits(Sales_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT ventprod.Vent_Prod_ID, ventprod.Produit_ID,ventprod.Prix_Vente,ventprod.Quantite,produit.Nom FROM  ventprod INNER JOIN produit on ventprod.Produit_ID = produit.Produit_ID WHERE Vente_ID=" +
        Sales_ID,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_Facture_Produits(Facture_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT factprod.Fact_Prod_ID, factprod.Produit_ID,factprod.Prix_Achat,factprod.Quantite,produit.Nom FROM  factprod INNER JOIN produit on factprod.Produit_ID = produit.Produit_ID WHERE Facture_ID=" +
        Facture_ID,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_Factprod_IDs_From_Fact(Facture_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT Fact_Prod_ID  FROM  factprod  WHERE Facture_ID=" + Facture_ID,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function refference() {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT refference,COUNT(*) as count  FROM  produit  GROUP BY refference HAVING COUNT(*)>1",
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_Ventprod_IDs_From_Vent(Vente_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT Vent_Prod_ID  FROM  ventprod  WHERE Vente_ID=" + Vente_ID,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

async function Get_Product_By_CodeBarre(Code_Barre) {
  const result = await Get_Produit_id_By_CodeBarre(Code_Barre);
  console.log(JSON.stringify(result));
  const Result = await Get_Produit_By_id(result[0].Produit_ID);
  Result[0].Code_Barre = Code_Barre;
  return Result;
}

function Get_Produit_id_By_CodeBarre(Code_Barre) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT Produit_ID FROM  code_barres WHERE Code_Barre=" + Code_Barre,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_Produit_By_id(Produit_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT * FROM  produit WHERE Produit_ID=" + Produit_ID,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_Produit_Nom_By_id(Produit_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT Nom FROM  produit WHERE Produit_ID=" + Produit_ID,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_Produit_Prix_Vente_By_id(Produit_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT Prix_Unit  FROM  produit WHERE Produit_ID=" + Produit_ID,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_factprod_info(Fact_Prod_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT * FROM factprod WHERE Fact_Prod_ID=" + Fact_Prod_ID,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Get_ventprod_info(vent_Prod_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "SELECT * FROM  ventprod WHERE Vent_Prod_ID=" + vent_Prod_ID,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}
//add ------------------------------------------------------------------
function Add_Produit_1(Nom, Refference, Prix_Unit) {
  return new Promise((resolve, reject) => {
    const VALUES = [Refference, Nom, Prix_Unit];
    console.log("0000" + Refference);
    con.query(
      "INSERT INTO produit ( Refference, Nom, Prix_Unit) VALUES ( ?, ?, ?)",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Add_Produit_Code_Barre(Produit_ID, Code_Barre) {
  return new Promise((resolve, reject) => {
    const VALUES = [Produit_ID, Code_Barre];
    con.query(
      "INSERT INTO Code_Barres (Produit_ID, Code_Barre) VALUES (?, ?)",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}
async function Add_Produit(Code_Barre, Nom, Refference, Prix_Unit) {
  const result = await Add_Produit_1(Nom, Refference, Prix_Unit);
  for (let c of Code_Barre) {
    var r = await Add_Produit_Code_Barre(result.insertId, c);
  }
  return r;
}

function Add_FactProd(Facture_ID, Produit_ID, Prix_Achat, Quantite) {
  return new Promise((resolve, reject) => {
    const VALUES = [Facture_ID, Produit_ID, Prix_Achat, Quantite];

    con.query(
      "INSERT INTO factprod (Facture_ID, Produit_ID, Prix_Achat, Quantite) VALUES (?, ?, ?, ?)",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
          Update_Produit_Plus(Quantite, Produit_ID);
          Update_Produit_Prix_Achat(Prix_Achat, Produit_ID);
        }
      }
    );
  });
}

function Add_Facture(Montant_Total) {
  return new Promise((resolve, reject) => {
    const VALUES = [Montant_Total];
    con.query(
      "INSERT INTO facture  (Montant_Total) VALUES (?)",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Add_Vente(Montant_Total) {
  return new Promise((resolve, reject) => {
    con.query(
      "INSERT INTO vente ( Montant_Total) VALUES (?)",
      Montant_Total,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Add_VentProd(Vente_ID, Produit_ID, Prix_Vente, Quantite) {
  return new Promise((resolve, reject) => {
    const VALUES = [Vente_ID, Produit_ID, Prix_Vente, Quantite];
    con.query(
      "INSERT INTO ventprod (Vente_ID, Produit_ID, Prix_Vente, Quantite) VALUES (?, ?, ?, ?)",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
          Update_Produit_Moins(Quantite, Produit_ID);
        }
      }
    );
  });
}

//Delete----------------------------------------------------
async function Delete_Fact_Prod_Update_Facture(Fact_Prod_ID) {
  const Fact_Prod_Info = await Get_factprod_info(Fact_Prod_ID);
  await Update_Facture_Moins(
    Fact_Prod_Info[0].Facture_ID,
    Fact_Prod_Info[0].Quantite * Fact_Prod_Info[0].Prix_Achat
  );
  await Update_Produit_Moins(
    Fact_Prod_Info[0].Quantite,
    Fact_Prod_Info[0].Produit_ID
  );
  await Delete_FactProd(Fact_Prod_ID);
}
async function Delete_Vent_Prod_Update_Facture(Vent_Prod_ID) {
  const Vent_Prod_Info = await Get_ventprod_info(Vent_Prod_ID);
  var sum = Vent_Prod_Info[0].Quantite * Vent_Prod_Info[0].Prix_Vente;
  await Update_Produit_Plus(
    Vent_Prod_Info[0].Quantite,
    Vent_Prod_Info[0].Produit_ID
  );
  await Update_Vente_moins(Vent_Prod_Info[0].Vente_ID, sum);
  await Delete_VentProd(Vent_Prod_ID);
}

function Delete_FactProd(Fact_Prod_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "DELETE FROM factprod WHERE Fact_Prod_ID = ?",
      [Fact_Prod_ID],
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}
async function Delete_All_FactProd_with_update_Stock(Facture_ID) {
  const FactProds = await Get_Factprod_IDs_From_Fact(Facture_ID);

  for (let factprod of FactProds) {
    const FactProdInfo = await Get_factprod_info(factprod.Fact_Prod_ID);
    console.log("FactProdInfo" + JSON.stringify(FactProdInfo));
    await Update_Produit_Moins(
      FactProdInfo[0].Quantite,
      FactProdInfo[0].Produit_ID
    );

    console.log(
      "info" + FactProdInfo[0].Quantite + " && " + FactProdInfo[0].Produit_ID
    );
  }
  await Delete_All_FactProd(Facture_ID);
}
async function Delete_All_VentProd_with_update_Stock(Sales_ID) {
  const VentProds = await Get_Ventprod_IDs_From_Vent(Sales_ID);

  for (let VentProd of VentProds) {
    const VentProdInfo = await Get_ventprod_info(VentProd.Vent_Prod_ID);
    console.log("VentProdInfo" + JSON.stringify(VentProdInfo));
    await Update_Produit_Moins(
      VentProdInfo[0].Quantite,
      VentProdInfo[0].Produit_ID
    );

    console.log(
      "info" + VentProdInfo[0].Quantite + " && " + VentProdInfo[0].Produit_ID
    );
  }

  await Delete_All_VentProd(Sales_ID);
}

function Delete_All_VentProd(Sales_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "DELETE FROM ventprod WHERE Vente_ID = ?",
      [Sales_ID],
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Delete_All_FactProd(Facture_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "DELETE FROM factprod WHERE Facture_ID = ?",
      [Facture_ID],
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}
async function Delete_VentProd_with_update(Vent_Prod_ID) {
  const VentProdInfo = await Get_ventprod_info(Vent_Prod_ID);
  await Delete_VentProd(Vent_Prod_ID);
  await Update_Produit_Plus(
    VentProdInfo[0].Quantite,
    VentProdInfo[0].Produit_ID
  );
}
async function Delete_FactProd_with_update(Fact_Prod_ID) {
  const FactProdInfo = await Get_factprod_info(Fact_Prod_ID);
  await Delete_FactProd(Fact_Prod_ID);
  await Update_Produit_Moins(
    FactProdInfo[0].Quantite,
    FactProdInfo[0].Produit_ID
  );
}

function Delete_VentProd(Vent_Prod_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "DELETE FROM ventprod WHERE Vent_Prod_ID = ?",
      [Vent_Prod_ID],
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

async function Delete_Facture_with_update(Facture_ID) {
  const FactProds = await Get_Factprod_IDs_From_Fact(Facture_ID);

  for (let factprod of FactProds) {
    const FactProdInfo = await Get_factprod_info(factprod.Fact_Prod_ID);
    console.log("FactProdInfo" + JSON.stringify(FactProdInfo));
    await Update_Produit_Moins(
      FactProdInfo[0].Quantite,
      FactProdInfo[0].Produit_ID
    );

    console.log(
      "info" + FactProdInfo[0].Quantite + " && " + FactProdInfo[0].Produit_ID
    );
  }

  const results = await Delete_Facture(Facture_ID);
}
async function Delete_Vente_with_update(Vente_ID) {
  const VentProds = await Get_Ventprod_IDs_From_Vent(Vente_ID);

  for (let venrprod of VentProds) {
    const VentProdInfo = await Get_ventprod_info(venrprod.Vent_Prod_ID);
    console.log("VentProdInfo" + JSON.stringify(VentProdInfo));
    await Update_Produit_Plus(
      VentProdInfo[0].Quantite,
      VentProdInfo[0].Produit_ID
    );

    console.log(
      "info" + VentProdInfo[0].Quantite + " && " + VentProdInfo[0].Produit_ID
    );
  }

  const results = await Delete_Vente(Vente_ID);
}

function Delete_Facture(Facture_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "DELETE FROM facture WHERE Facture_ID = ?",
      [Facture_ID],
      async (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Delete_Produit(Produit_ID) {
  return new Promise((resolve, reject) => {
    con.query(
      "DELETE FROM produit WHERE Produit_ID = ?",
      [Produit_ID],
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Delete_Product_CodeBarres(Produit_ID) {
  return new Promise(async (resolve, reject) => {
    con.query(
      "DELETE FROM code_barres WHERE Produit_ID = ?",
      [Produit_ID],
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Delete_Vente(Vente_ID) {
  return new Promise(async (resolve, reject) => {
    con.query(
      "DELETE FROM vente WHERE Vente_ID = ?",
      [Vente_ID],
      async (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

//Update--------------------------------------------------------------------
function Update_FactProd(
  Fact_Prod_ID,
  Facture_ID,
  Produit_ID,
  Prix_Achat,
  Quantite
) {
  return new Promise((resolve, reject) => {
    const VALUES = [Facture_ID, Produit_ID, Prix_Achat, Quantite, Fact_Prod_ID];
    con.query(
      "UPDATE factprod SET Facture_ID = ?, Produit_ID = ?, Prix_Achat = ?, Quantite = ? WHERE Fact_Prod_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Update_Facture(Facture_ID, Montant_Total) {
  return new Promise((resolve, reject) => {
    const VALUES = [Montant_Total, Facture_ID];
    con.query(
      "UPDATE facture SET  Montant_Total = ? WHERE Facture_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Update_Facture_Moins(Facture_ID, Montant_Total) {
  return new Promise((resolve, reject) => {
    const VALUES = [Montant_Total, Facture_ID];
    con.query(
      "UPDATE facture SET  Montant_Total = Montant_Total-? WHERE Facture_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Update_Produit_Moins(Stock_Q, Produit_ID) {
  return new Promise((resolve, reject) => {
    const VALUES = [Stock_Q, Produit_ID];
    con.query(
      "UPDATE produit SET  	Stock_Q  =  	Stock_Q  - ? WHERE Produit_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Update_Produit_Plus(Stock_Q, Produit_ID) {
  return new Promise((resolve, reject) => {
    const VALUES = [Stock_Q, Produit_ID];
    con.query(
      "UPDATE produit SET  	Stock_Q  = Stock_Q  + ? WHERE Produit_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Update_Produit_Prix_Achat(Prix_Achat, Produit_ID) {
  return new Promise((resolve, reject) => {
    const VALUES = [Prix_Achat, Produit_ID];
    con.query(
      "UPDATE produit SET  	Prix_Achat  =   ? WHERE Produit_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Update_Vente(Vente_ID, Montant_Total) {
  return new Promise((resolve, reject) => {
    const VALUES = [Montant_Total, Vente_ID];
    con.query(
      "UPDATE vente SET Montant_Total = ? WHERE Vente_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Update_Vente_moins(Vente_ID, Montant_Total) {
  return new Promise((resolve, reject) => {
    const VALUES = [Montant_Total, Vente_ID];
    con.query(
      "UPDATE vente SET Montant_Total = Montant_Total-? WHERE Vente_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Update_VentProd(
  Vent_Prod_ID,
  Vente_ID,
  Produit_ID,
  Prix_Vente,
  Quantite
) {
  return new Promise((resolve, reject) => {
    const VALUES = [Vente_ID, Produit_ID, Prix_Vente, Quantite, Vent_Prod_ID];
    con.query(
      "UPDATE ventprod SET Vente_ID = ?, Produit_ID = ?, Prix_Vente = ?, Quantite = ? WHERE Vent_Prod_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

function Update_Produit_1(
  Refference,
  Nom,
  Prix_Unit,
  Produit_ID,
  Sales_Rapid,
  Image
) {
  return new Promise((resolve, reject) => {
    if (Sales_Rapid === 1) {
      Sales_Rapid === true;
    } else if (Sales_Rapid === 0) {
      Sales_Rapid = false;
    }
    const VALUES = [Refference, Nom, Prix_Unit, Sales_Rapid, Image, Produit_ID];
    con.query(
      "UPDATE produit SET  Refference = ?, Nom = ?, Prix_Unit = ?  , Sales_Rapid = ?, Image = ? WHERE Produit_ID = ?",
      VALUES,
      (error, results) => {
        if (error) {
          reject("Error executing query: " + error);
        } else {
          resolve(results);
        }
      }
    );
  });
}
async function Update_Produit(
  Code_Barres,
  Refference,
  Nom,
  Prix_Unit,
  Produit_ID,
  Sales_Rapid,
  Image
) {
  var t = [];
  var r;
  await Delete_Product_CodeBarres(Produit_ID);
  await Update_Produit_1(
    Refference,
    Nom,
    Prix_Unit,
    Produit_ID,
    Sales_Rapid,
    Image
  );
  Code_Barres.forEach(async (code_Barre) => {
    r = await Add_Produit_Code_Barre(Produit_ID, code_Barre);
  });
  return r;
}
async function a() {
  //  await Update_Produit_Plus(2);
  //const r = await Get_Factprod_IDs_From_Fact(919);

  // result.then(deconecter);
  const result = await refference();

  var x = await deconecter();
  console.log(JSON.stringify(result));
}
//a();
export {
  Delete_All_FactProd_with_update_Stock,
  Delete_FactProd_with_update,
  Delete_VentProd_with_update,
  Update_Produit_Plus,
  Update_Produit_Moins,
  Get_Ventprod_IDs_From_Vent,
  Get_Factprod_IDs_From_Fact,
  Get_Facture_Produits,
  Get_Sales_Produits,
  deconecter,
  GetAll,
  GetAllProducts,
  Delete_Vent_Prod_Update_Facture,
  Delete_Fact_Prod_Update_Facture,
  Get_Produit_Prix_Vente_By_id,
  Add_Produit,
  Get_Produit_Nom_By_id,
  Add_FactProd,
  Add_Facture,
  Add_Vente,
  Add_VentProd,
  Delete_FactProd,
  Delete_Facture_with_update,
  Delete_Produit,
  Delete_Vente_with_update,
  Delete_VentProd,
  Update_FactProd,
  Update_Facture,
  Update_Vente,
  Update_Produit,
  Update_VentProd,
  Delete_All_VentProd_with_update_Stock,
  Get_Product_By_CodeBarre,
  GetAllProducts_with_All_CodeBarres,
  Get_Products_Sales_Rapid,
};
