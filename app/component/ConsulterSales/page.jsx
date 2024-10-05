"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation"; // Use the correct import
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import ProductList from "@/app/component/suggestion/page";
import style from "@/app/Factures/NewFactures/page.module.css";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import FilledInput from "@mui/material/FilledInput";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PageDjo from "@/app/component/PageDjo/page";
import FactTable from "@/app/component/FactTable/page";
import NumberInput from "@/app/component/NumberInput/page";
import TextField from "@mui/material/TextField";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";

import { useEffect, useRef, useState } from "react";
import { Router } from "react-router-dom";

function ConsulterFact({ Sales_Id, onUpdateComplete }) {
  const [ClickUpdate, setClickUpdate] = useState(true);
  const router = useRouter();
  const [Sales_ID, setSales_ID] = useState();
  useEffect(() => {
    setSales_ID(Sales_Id);
  }, [Sales_Id]);
  const title = "Sales";
  const Thead = ["Nom", "Prix_Vente", "Quantite", "Sum"];
  const textFieldNom = useRef(null);
  const textFieldCode_Barre = useRef(null);
  var textFieldQuantite = useRef(null);
  const [alert, setAlert] = useState({ message: "", severity: "" });
  const [Sales, setSales] = useState([]);
  const [display, setdisplay] = useState(false);
  const [products, setproducts] = useState();
  const [product, setproduct] = useState([{}]);
  const [Code_Barre_Label, setCode_Barre_Label] = useState("Code_Barre");
  const [Nom_Label, setNom_Label] = useState("Nom");
  const [Q, setQ] = useState(1);
  async function fetchhistory(Sales_ID) {
    try {
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
        throw new Error("Failed to fetch product history");
      }

      var data = await response.json();
    } catch (error) {
      console.error(error.message);
    }
    return data;
  }
  async function Get_Sale(Sales_ID) {
    const data = await fetchhistory(Sales_ID);
    if (data) {
      console.log("====" + Object.values(data));
      setSales(Object.values(data));
    }
  }

  const OnAdd = async () => {
    // Accessing values from refs
    const Code_Barre = textFieldCode_Barre.current?.value;
    const Quantite = textFieldQuantite.current?.querySelector("input")?.value;
    var data = await fetchProdact(Code_Barre);
    if (!data || data.length < 1) {
      Swal.fire({
        title: "Oops...",
        text: " product undefined.",
        icon: "error",
      });
    }
    const NewRow = {
      Produit_ID: data[0].Produit_ID,
      Nom: data[0].Nom,
      Prix_Vente: data[0].Prix_Unit,
      Quantite: Quantite,
    };
    if (Sales[0] === undefined) {
      setSales([NewRow]);
    } else if (Sales[0].Nom === undefined) {
      setSales([NewRow]);
    } else {
      setSales((prevSales) => [...prevSales, NewRow]);
    }
    setAlert({
      message: "Success! The product has been added.",
      severity: "success",
    });
    SoundAdd.play();
    textFieldCode_Barre.current.focus();
    textFieldCode_Barre.current.select();

    setQ(Q + 1);
    if (printRef.current) {
      const lastChild = printRef.current.lastElementChild;
      if (lastChild) {
        lastChild.scrollIntoView({ behavior: "smooth" });
      }
    }
    setTimeout(() => {
      setAlert({ message: "", severity: "" });
    }, 500);
  };
  const Entre = (event) => {
    console.log("imhere");
    if (event.key === "Enter") {
      OnAdd();
      // Handle custom Enter key behavior here
      console.log("Enter key pressed");
    }
  };
  function button_Delete() {
    var Button_Delete = document.getElementsByName("Button_Delete");
    Button_Delete.forEach((B) => {
      B.onclick = function () {
        setSales((prevSales) => {
          const updatedSales = [...prevSales];
          updatedSales.splice(B.id, 1);
          return updatedSales;
        });
      };
    });
  }
  async function fetch_ALL_Prodact() {
    const All = "All";
    try {
      const response = await fetch(
        `/api/Sales?All=${encodeURIComponent(All)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch product ");
      }

      var data = await response.json();
      console.log("data" + JSON.stringify(data));
    } catch (error) {
      console.error(error.message);
    }
    setproduct(data);
    setproducts(data);

    return data;
  }
  async function fetchProdact(Code_Barre) {
    try {
      const response = await fetch(
        `/api/Sales/ProdSales?Code_Barre=${encodeURIComponent(Code_Barre)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch product ");
      }

      var data = await response.json();
      console.log("data" + JSON.stringify(data));
    } catch (error) {
      console.error(error.message);
    }
    return data;
  }

  async function Delete_VentProd_and_Update_Sales_Montant(
    Sales_ID,
    Montant_Total
  ) {
    try {
      const response = await fetch("/api/Sales", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Montant_Total, Sales_ID }), // Add your actual data here
      });

      if (!response.ok) {
        throw new Error("Failed to Delete VentProd and Update Montant Sales");
      }

      const data = await response.json();
      const insertId = data.result.insertId;

      return insertId;
    } catch (error) {
      console.error(error.message);
    }
  }
  async function add_Products_toSales(Sales_ID, Sales) {
    var i = 0;
    for (let Sale of Sales) {
      const Produit_ID = Sale.Produit_ID;
      const Quantite = Sale.Quantite;
      const Prix_Vente = Sale.Prix_Vente;

      console.log(Sales_ID, Produit_ID, Prix_Vente, Quantite);

      const all = { Sales_ID, Produit_ID, Prix_Vente, Quantite };

      try {
        const response = await fetch("/api/Sales/ProdSales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(all),
        });

        if (!response.ok) {
          throw new Error("Failed to add produit to Sales");
        }

        const data = await response.json().then();
        i++;
        console.log("Product added successfully:", data);
      } catch (error) {
        console.error("Error:", error.message);
      }
    }
    if (i === Sales.length && i != 0) {
      return true;
    } else {
      return false;
    }
  }
  async function ValiderSales() {
    if (Sales.length > 0) {
      const Montant_Total =
        document.getElementById("Montant_Totatl").textContent;
      const Result = await Delete_VentProd_and_Update_Sales_Montant(
        Sales_ID,
        Montant_Total
      );
      const R = await add_Products_toSales(Sales_ID, Sales);
      if (R === true) {
        setAlert({
          message: "Success! The Sale has been Updated.",
          severity: "success",
        });

        onUpdateComplete();
        setTimeout(() => {
          setAlert({ message: "", severity: "" });
        }, 2000);
      } else {
        setAlert({
          message: "error! The Sale not been Updated!",
          severity: "error",
        });
        setTimeout(() => {
          setAlert({ message: "", severity: "" });
        }, 2000);
      }
      console.log("final=====" + JSON.stringify(R));
    } else {
      setAlert({
        message: "error! The Sale is vide!",
        severity: "error",
      });
      setTimeout(() => {
        setAlert({ message: "", severity: "" });
      }, 2000);
    }
  }
  function Filter() {
    setdisplay(true);

    var value = textFieldNom.current.value;
    var newproduct = products.filter((p) =>
      p.Nom.toLowerCase().includes(value.toLowerCase())
    );
    setproduct(newproduct);
  }
  useEffect(() => {
    if (Sales_ID) {
      Get_Sale(Sales_ID);
    }
  }, [Sales_ID]);
  useEffect(() => {
    setTimeout(() => {
      button_Delete();
    }, 1000);

    console.log("Sales--" + JSON.stringify(Sales));
  }, [Sales]);
  useEffect(() => {
    const listItems = document.querySelectorAll("#myList li");
    //  var textfield = document.getElementById("");
    listItems.forEach((item) => {
      // Add event listener for mouseover
      item.addEventListener("mouseover", () => {
        const listItems = item.querySelectorAll("div");
        var Nom = listItems[0].textContent;
        textFieldNom.current.value = Nom;
        setNom_Label("");
        // Get the data from the hovered item
        const info = item.id;
        console.log("info" + info);
        // Set the data into the display area

        textFieldCode_Barre.current.value = info;
        setCode_Barre_Label("");
      });
    });
  }, [product]);
  function Display_Off() {
    setdisplay(false);
  }
  return (
    <div className={style.All}>
      {alert.message && (
        <div
          style={{
            width: "600px",
            position: "fixed",
            top: "39px", // Positioned at the top
            right: "20px", // Right margin for positioning
            zIndex: 1000,
          }}
        >
          <Alert severity={alert.severity} style={{ margin: "0 auto" }}>
            <AlertTitle>{alert.severity}</AlertTitle>
            {alert.message}
          </Alert>
        </div>
      )}
      <div className={style.body}>
        <PageDjo title={title} />
        <Box
          sx={{
            padding: "20px",
            paddingLeft: "40px",
            bgcolor: "primary.white",
            justifyContent: "center",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {" "}
          <div onBlur={Display_Off} className={style.Sug}>
            {" "}
            <TextField
              onKeyDown={Entre}
              autoComplete="off"
              inputRef={textFieldNom}
              id="outlined-basic"
              label={Nom_Label}
              variant="outlined"
              onFocus={fetch_ALL_Prodact}
              onChange={Filter}
            />
            {display && <ProductList products={product} />}
          </div>
          <TextField
            inputRef={textFieldCode_Barre}
            sx={{ bgcolor: "white" }}
            id="outlined-basic"
            label={Code_Barre_Label}
            variant="outlined"
            autoComplete="off"
          />
          <NumberInput V={Q} min={-10} max={10000} R={textFieldQuantite} />
          <Fab onClick={OnAdd} color="primary" aria-label="add">
            <AddIcon />
          </Fab>
          <InputLabel
            sx={{
              color: "dodgerblue",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            Valider votre facture
          </InputLabel>
          <Fab onClick={ValiderSales} color="primary" aria-label="Check">
            <CheckIcon />
          </Fab>
        </Box>
      </div>
      <div id="print">
        <FactTable rowss={Sales} Thead={Thead} />
      </div>
    </div>
  );
}
export default ConsulterFact;
