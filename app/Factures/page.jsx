"use client";
import Swal from "sweetalert2";
import style from "@/app/Factures/page.module.css";
import CollapsibleTable from "@/app/component/TableMUI/page";
import PageDjo from "@/app/component/PageDjo/page";
import { useEffect, useRef, useState } from "react";
import UpdatePage from "@/app/component/ConsulteFact/page";
function Factures() {
  var title = "Factures";
  var Thead = ["Facture_ID", "Date", "Montant_Total"];
  var object = [
    {
      Facture_ID: "01",
      Date: "11/08/2024",
      Montant_Total: "1200.00",
      History: [{ Produit_ID: "Goma", Prix_Achat: "10", Quantite: "20" }],
    },
  ];
  var Thead_History = ["Nom", "Prix_Achat", "Quantite"];
  const [ok, setok] = useState(false);
  const [Facture_ID, setFacture_ID] = useState("");
  const [Facture_ID_Update_Page, setFacture_ID_Update_Page] = useState("");

  const [rowss, setrowss] = useState([
    {
      Facture_ID: "vide",
      Date: "vide",
      Montant_Total: "vide",
      History: [{ Produit_ID: "vide", Prix_Achat: "vide", Quantite: "vide" }],
    },
  ]);
  const [Factures, setFactures] = useState(null);
  const [history, sethistory] = useState(null);
  const [ClickUpdate, setClickUpdate] = useState(false);
  async function Deletehistory(e) {
    const FactProd_ID = e.target.id;

    console.log(FactProd_ID);
    var FactProd_ID2 = FactProd_ID;
    const response = await fetch("/api/Factures/ProdFact", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ FactProd_ID2 }), // Wrap in an object and stringify
    });

    if (!response.ok) {
      throw new Error("Failed to delete Produit From Facture history");
    }

    // Fetch updated Factures
    await fetchfact().then(setFactures).catch(console.error);
  }
  function Display_Update() {
    setClickUpdate(false);
  }
  var Button_Delete = document.getElementsByName("Button_Delete_history");
  Button_Delete.forEach((B) => {
    B.onclick = function () {
      Deletehistory(B.id);
    };
  });
  async function Delete(id) {
    console.log("swall");
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setok(true);
        setFacture_ID(id);
        Swal.fire({
          title: "Loading...",
          html: "Please wait while we process your request.",
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading();
          },
        });
      }
    });
    console.log("ok" + ok);
  }
  async function DeleteFacture(Facture_ID) {
    event.preventDefault();

    console.log(Facture_ID);
    const response = await fetch("/api/Factures", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Facture_ID }), // Wrap in an object and stringify
    });

    if (!response.ok) {
      Swal.fire({
        title: "Oops...",
        text: "Failed to delete Fact.",
        icon: "error",
      });
      throw new Error("Failed to delete Factures");
    } else {
      await fetchfact().then(setFactures).catch(console.error);
      Swal.fire({
        title: "Deleted!",
        text: "Your Produit has been deleted.",
        icon: "success",
      });
    }
  }
  useEffect(() => {
    if (ok) {
      setok(false);
      DeleteFacture(Facture_ID);
    }
  }, [Facture_ID]);

  var Button_Delete = document.getElementsByName("Button_Delete");
  Button_Delete.forEach((B) => {
    B.onclick = function () {
      Delete(B.id);
    };
  });

  async function Delete_Facture_NonValider(id) {
    try {
      const response = await fetch("/api/Factures", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to Delete Non validate Facture");
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  }
  async function fetchfact() {
    await Delete_Facture_NonValider(12);
    const respons = await fetch("/api/Factures");
    if (!respons.ok) {
      throw new Error("failed to fetch Facture");
    }
    return respons.json();
  }

  async function fetchhistory(Facture_ID) {
    try {
      Delete_Facture_NonValider(16);
      const response = await fetch(
        `/api/Factures/ProdFact?Facture_ID=${encodeURIComponent(Facture_ID)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch product history");
      }

      var data = await response.json();
      console.log("data" + JSON.stringify(data));
    } catch (error) {
      console.error(error.message);
    }
    return data;
  }

  useEffect(() => {
    fetchfact().then(setFactures).catch(console.error);
  }, []);

  useEffect(() => {
    console.log("rowss--" + JSON.stringify(rowss));
  }, [rowss]);
  useEffect(() => {
    if (Factures !== null) {
      const processFactures = async () => {
        const updatedFactures = await Promise.all(
          Factures.map(async (p, i) => {
            p.id = i;
            p.History = await fetchhistory(p.Facture_ID);
            return p;
          })
        );

        setrowss(Factures);
      };

      processFactures();
    }
  }, [Factures]);
  async function AfterUpdate() {
    await fetchfact().then(setFactures).catch(console.error);
    console.log("its false");
    var Button_Update = document.getElementsByName("Button_Modify");
    Button_Update.forEach((B) => {
      B.onclick = function () {
        setFacture_ID_Update_Page(B.id);
        console.log("here" + B.id);
        setClickUpdate(true);
        console.log("here" + ClickUpdate);
      };
    });
    var Button_Delete = document.getElementsByName("Button_Delete");
    Button_Delete.forEach((B) => {
      B.onclick = function () {
        Delete(B.id);
      };
    });
  }
  useEffect(() => {
    console.log("its ?????");

    if (ClickUpdate === false) {
      AfterUpdate();
    }
  }, [ClickUpdate]);
  var Button_Update = document.getElementsByName("Button_Modify");
  Button_Update.forEach((B) => {
    B.onclick = function () {
      setFacture_ID_Update_Page(B.id);
      console.log("here" + B.id);
      setClickUpdate(true);
      console.log("here" + ClickUpdate);
    };
  });
  function Update() {}
  return (
    <>
      {" "}
      {ClickUpdate ? (
        <UpdatePage
          Facture_Id={Facture_ID_Update_Page}
          onUpdateComplete={Display_Update}
        />
      ) : (
        <div className={style.all}>
          <PageDjo title={title} />
          <div className={style.Fact}>
            {" "}
            <CollapsibleTable
              Thead={Thead}
              object={rowss}
              Thead_History={Thead_History}
              unction={Deletehistory}
            />
          </div>
        </div>
      )}
    </>
  );
}
export default Factures;
