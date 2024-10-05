"use client";
import Swal from "sweetalert2";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { useEffect, useRef, useState } from "react";
import InputLabel from "@mui/material/InputLabel";
import { Howl } from "howler";
import CheckIcon from "@mui/icons-material/Check";
import PageDjo from "@/app/component/PageDjo/page";
import NumberInput from "@/app/component/NumberInput/page";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import FactTable from "@/app/component/FactTable/page";
import TextField from "@mui/material/TextField";
import style from "@/app/Sales/NewSales/page.module.css";
import { useRouter } from "next/router";
import { ClassNames } from "@emotion/react";
import ProductList from "@/app/component/suggestion/page";
import { height, margin, width } from "@mui/system";
import Sales_Rapid from "@/app/component/SalesRapid/page";
function NewSels() {
  const textFieldCode_Barre = useRef(null);
  var textFieldQuantite = useRef(null);
  const printRef = useRef(null);
  const SoundAdd = new Howl({
    src: ["/Add.mp3"],
  });
  const SoundValider = new Howl({
    src: ["/Valider.mp3"],
  });

  const textFieldNom = useRef(null);
  const [alert, setAlert] = useState({ message: "", severity: "" });
  const [Sales, setSales] = useState([]);
  const [Q, setQ] = useState(1);

  const [product, setproduct] = useState([{}]);
  const [display, setdisplay] = useState(false);
  const [products, setproducts] = useState();
  const [Code_Barre_Label, setCode_Barre_Label] = useState("Code_Barre");
  const [Nom_Label, setNom_Label] = useState("Nom");

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
  async function fetch_ALL_Prodact() {
    textFieldNom.current.select();

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
  const OnAdd_Rapid = async (Code_Barre) => {
    // Accessing values from refs
    const Quantite = 1;
    var data = await fetchProdact(Code_Barre);
    // Create a new row object
    if (!data || data.length < 1) {
      Swal.fire({
        title: "Oops...",
        text: " product undefined.",
        icon: "error",
      });
    }
    const prod = Sales.findIndex((sale) => sale.id === data[0].Produit_ID);

    if (prod !== -1) {
      Sales[prod].Quantite =
        parseInt(Quantite) + parseInt(Sales[prod].Quantite);
      setSales([...Sales]);
      setAlert({
        message:
          Sales[prod].Nom +
          "  Quantite added with " +
          Quantite +
          "  Total:" +
          Sales[prod].Quantite,
        severity: "info",
      });
      SoundAdd.play();
      setTimeout(() => {
        setAlert({ message: "", severity: "" });
      }, 2000);
      textFieldCode_Barre.current.focus();
      textFieldCode_Barre.current.select();

      setQ(Q + 1);
      if (printRef.current) {
        const rows = printRef.current.querySelectorAll("tr");
        if (rows[prod]) {
          rows[prod].scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      const NewRow = {
        id: data[0].Produit_ID,
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
    }
  };
  const OnAdd = async () => {
    // Accessing values from refs
    const Code_Barre = textFieldCode_Barre.current?.value;
    const Quantite = textFieldQuantite.current?.querySelector("input")?.value;
    var data = await fetchProdact(Code_Barre);
    // Create a new row object
    if (!data || data.length < 1) {
      Swal.fire({
        title: "Oops...",
        text: " product undefined.",
        icon: "error",
      });
    }
    const prod = Sales.findIndex((sale) => sale.id === data[0].Produit_ID);
    console.log("new" + prod);
    if (prod !== -1) {
      Sales[prod].Quantite =
        parseInt(Quantite) + parseInt(Sales[prod].Quantite);
      setSales([...Sales]);
      setAlert({
        message:
          Sales[prod].Nom +
          "  Quantite added with " +
          Quantite +
          "  Total:" +
          Sales[prod].Quantite,
        severity: "info",
      });
      SoundAdd.play();
      setTimeout(() => {
        setAlert({ message: "", severity: "" });
      }, 2000);
      textFieldCode_Barre.current.focus();
      textFieldCode_Barre.current.select();

      setQ(Q + 1);
      if (printRef.current) {
        const lastChild = printRef.current.lastElementChild;
        if (lastChild) {
          lastChild.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      const NewRow = {
        id: data[0].Produit_ID,
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
    }
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
    console.log(Button_Delete);
    Button_Delete.forEach((B) => {
      B.onclick = function () {
        setSales((prevSales) => {
          const updatedSales = [...prevSales];
          console.log("id" + B.id + "=====" + updatedSales);
          updatedSales.splice(B.id, 1);
          return updatedSales;
        });
      };
    });
  }
  async function creatSales(Montant_Total) {
    try {
      const response = await fetch("/api/Sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Montant_Total }), // Add your actual data here
      });

      if (!response.ok) {
        throw new Error("Failed to create Sales");
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
      const Produit_ID = Sale.id;
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
      var Sales_ID = await creatSales(Montant_Total);
      var R = await add_Products_toSales(Sales_ID, Sales);
      if (R === true) {
        setSales([]);
        setAlert({
          message: "Success! The Sales has been added.",
          severity: "success",
        });
        SoundValider.play();

        setTimeout(() => {
          setAlert({ message: "", severity: "" });
        }, 2000);
      } else {
        setAlert({
          message: "error! The Sales not been added!",
          severity: "error",
        });
        setTimeout(() => {
          setAlert({ message: "", severity: "" });
        }, 2000);
      }
    } else {
      setAlert({
        message: "error! The Sales is vide!",
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
    console.log(product);
  }
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
  useEffect(() => {
    console.log("Sales--" + JSON.stringify(Sales));
    setTimeout(() => {
      button_Delete();
    }, 2000);
  }, [Sales]);

  var title = "New Sales";
  var Thead = ["Nom", "Prix_Vente", "Quantite", "Sum"];
  function Display_Off() {
    setdisplay(false);
  }

  return (
    <>
      <div className={style.container}>
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
            <PageDjo title={title} ClassNames={style.body} />
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
                onKeyDown={Entre}
                autoComplete="off"
                inputRef={textFieldCode_Barre}
                sx={{ bgcolor: "white" }}
                id="field_Codebarre"
                label={Code_Barre_Label}
                variant="outlined"
                style={{ letterSpacing: "normal", lineHeight: "1.5" }}
              />
              <NumberInput min={-10} max={10000} R={textFieldQuantite} V={Q} />

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
                Valider votre Sales
              </InputLabel>
              <Fab onClick={ValiderSales} color="primary" aria-label="Check">
                <CheckIcon />
              </Fab>
            </Box>
          </div>
          <div id="print">
            {" "}
            <FactTable ref={printRef} rowss={Sales} Thead={Thead} />
          </div>
        </div>
        <div className={style.SalesRapid}>
          {" "}
          <Sales_Rapid OnAdd_Rapid={OnAdd_Rapid} />
        </div>
      </div>
    </>
  );
}
export default NewSels;
