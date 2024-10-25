"use client";
import Swal from "sweetalert2";
import CollapsibleTable from "@/app/component/TableMUI/page";
import PageDjo from "@/app/component/PageDjo/page";
import style from "./page.module.css";
import { useEffect, useRef, useState } from "react";
import UpdatePage from "@/app/component/ConsulterSales/page";
import Stats from "@/app/component/Stats/page";
import { useRouter } from "next/navigation"; // Use the correct import

function Sales() {
  const [ok, setok] = useState(false);
  const [Sales_ID, setSales_ID] = useState([]);
  const [Sales_ID_Update_Page, setSales_ID_Update_Page] = useState("");
  const [ClickUpdate, setClickUpdate] = useState(false);
  const router = useRouter();

  async function Deletehistory(e) {
    const SalesProd_ID = e.target.id;
    event.preventDefault();
    var SalesProd_ID2 = SalesProd_ID;

    console.log(SalesProd_ID);
    const response = await fetch("/api/Sales/ProdSales", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ SalesProd_ID2 }), // Wrap in an object and stringify
    });

    if (!response.ok) {
      throw new Error("Failed to delete Produit From Sales");
    }

    // Fetch updated Factures
    fetchSales().then(setSales).catch(console.error);
  }
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
        setSales_ID(id);
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
  async function Delete_Sales(Sales_ID) {
    console.log(Sales_ID);
    const response = await fetch("/api/Sales", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Sales_ID }), // Wrap in an object and stringify
    });

    if (!response.ok) {
      Swal.fire({
        title: "Oops...",
        text: "Failed to delete Sales.",
        icon: "error",
      });
      throw new Error("Failed to delete Sales");
    } else {
      await fetchSales().then(setSales).catch(console.error);
      Swal.fire({
        title: "Deleted!",
        text: "Your Sales has been deleted.",
        icon: "success",
      });
    }
    // Fetch updated Factures
  }
  useEffect(() => {
    if (ok) {
      setok(false);
      Delete_Sales(Sales_ID);
    }
  }, [Sales_ID]);
  var Button_Delete = document.getElementsByName("Button_Delete");
  console.log("buttons" + Button_Delete.length);
  Button_Delete.forEach((B) => {
    B.onclick = function () {
      Delete(B.id);
    };
  });

  const [rowss, setrowss] = useState([
    {
      Sales_ID: "vide",
      Date: "vide",
      Montant_Total: "vide",
      History: [{ Produit_ID: "vide", Prix_Achat: "vide", Quantite: "vide" }],
    },
  ]);

  const [Sales, setSales] = useState(null);
  async function Delete_Sales_NonValider(id) {
    const Facture_ID = 0;
    try {
      const response = await fetch("/api/Sales", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to Delete Non validate Sales");
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  }
  async function fetchSales() {
    await Delete_Sales_NonValider(12);

    const respons = await fetch("/api/Sales");
    if (!respons.ok) {
      throw new Error("failed to fetch Sales");
    }
    return respons.json();
  }
  async function fetchhistory(Sales_ID) {
    try {
      Delete_Sales_NonValider;
      const response = await fetch(
        `/api/Sales/ProdSales?Sales_ID=${encodeURIComponent(Sales_ID)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch product Sales history");
      }

      var data = await response.json();
      console.log("data" + JSON.stringify(data));
    } catch (error) {
      console.error(error.message);
    }
    return data;
  }

  async function AfterUpdate() {
    await fetchSales().then(setSales).catch(console.error);
    console.log("its false");
    var Button_Update = document.getElementsByName("Button_Modify");
    Button_Update.forEach((B) => {
      B.onclick = function () {
        setSales_ID_Update_Page(B.id);
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
      setSales_ID_Update_Page(B.id);
      console.log("here" + B.id);
      setClickUpdate(true);
      console.log("here" + ClickUpdate);
    };
  });
  useEffect(() => {
    console.log("rowss--" + JSON.stringify(rowss));
  }, [rowss]);
  useEffect(() => {
    fetchSales().then(setSales).catch(console.error);
  }, []);
  useEffect(() => {
    if (Sales !== null) {
      const processFactures = async () => {
        const updatedSales = await Promise.all(
          Sales.map(async (p, i) => {
            p.id = i;
            p.History = await fetchhistory(p.Vente_ID);
            return p;
          })
        );

        setrowss(Sales);
      };

      processFactures();
    }
  }, [Sales]);

  var title = "Sales";

  var Thead = ["Vente_ID", "Date", "Montant_Total"];
  var object = [
    {
      ID: "1",
      Date: "2",
      Montant: "3",
      Client: "mossaab",
      History: [
        {
          Number: "01",
          Date: "2020-01-05",
          Quantite: "11091700",
        },
        {
          Number: "02",
          Date: "2020-01-02",
          Quantite: "Anonymous",
        },
        {
          Number: "02",
          Date: "2020-01-02",
          Quantite: "Anonymous",
        },
      ],
    },
    {
      ID: "11",
      Date: "22",
      Montant: "33",
      Client: "mossaab",
      History: [
        {
          Number: "01",
          Date: "2020-01-05",
          Quantite: "11091700",
        },
        {
          Number: "02",
          Date: "2020-01-02",
          Quantite: "Anonymous",
        },
      ],
    },
  ];
  function Visible_NewSales() {
    router.push("/Sales/NewSales");
  }

  var Thead_History = ["Nom", "Prix_Vente", "Quantite"];
  function Display_Update() {
    setClickUpdate(false);
  }
  return (
    <>
      {ClickUpdate ? (
        <UpdatePage
          Sales_Id={Sales_ID_Update_Page}
          onUpdateComplete={Display_Update}
        />
      ) : (
        <div className={style.All}>
          <PageDjo title={title} visible={Visible_NewSales} />
          <div className={style.fact}>
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
export default Sales;
