const sql = require("mysql");

function deconecter() {
  con.end((error) => {
    if (error) {
      console.error(error);
    }
    console.log("connextion close");
  });
}

const con = sql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "library",
});
con.connect((error) => {
  if (error) {
    console.error("error connection");
    return;
  }
  console.log("connextion ok");
});

function GetAll(TableName) {
  return new Promise((resolve, reject) => {
    con.query("SELECT * FROM 	" + TableName + "	", (error, results) => {
      if (error) {
        reject("Error executing query: " + error);
      } else {
        resolve(results);
      }
    });
  });
}

function Add_Produit(Code_Barre, Nom, Reference, Prix_Unit) {
  return new Promise((resolve, reject) => {
    var VALUES = [Code_Barre, Reference, Nom, Prix_Unit];
    con.query(
      "INSERT INTO	produit (Code_Barre, Reference, Nom, Prix_Unit)	VALUES (? ,?, ?, ? )",
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

async function Bdd() {
  var res1 = await Add_Produit("02", "gomme", "s-01", 30.0);
  var res = await GetAll("produit");
  console.log(res, res1);
  deconecter();
}
//Bdd();
module.exports = {
  Add_Produit,
};
