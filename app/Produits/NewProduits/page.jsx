"use client";
import Form from "@/app/component/Formulaire/page";
import DataGrid from "@/app/component/DataGrid/DataGrid";
import PageDjo from "@/app/component/PageDjo/page";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Swal from "sweetalert2";
import style from "@/app/Produits/NewProduits/page.module.css";
import { display } from "@mui/system";

function NewProduits() {
  const [alert, setAlert] = useState({ message: "", severity: "" });
  const [ok, setok] = useState(false);
  const [products, setProducts] = useState([]);
  const [rows, setrows] = useState([]);
  const [codeBarreFields, setCodeBarreFields] = useState([{ value: "" }]); // To hold Code_Barre fields
  const textFieldRefference = useRef(null);
  const textFieldCodeBarre = useRef([]);

  const textFieldNom = useRef(null);
  const textFieldPrix_Unit = useRef(null);
  const [Produit_ID_D, setProduit_ID_D] = useState();

  const ref = [textFieldRefference, textFieldNom, textFieldPrix_Unit];
  const columns = ["Refference", "Nom", "Prix_Unit"];
  const columnsTable = [
    "Produit_ID",
    "Code_Barre",
    "Refference",
    "Nom",
    "Prix_Unit",
    "Stock_Q",
    "Prix_Achat",
  ];
  const title = "New Produits";
  const columnss = [];

  var Actionsfield = {
    field: "Actions",
    headerName: "Actions",
    width: 200,
    renderCell: (params) => {
      async function Delete(event) {
        event.preventDefault();
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
            setProduit_ID_D(params.row.Produit_ID);
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
      }

      async function Delete_Produit(Produit_ID) {
        const response = await fetch("/api/products", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ Produit_ID }),
        });

        if (!response.ok) {
          Swal.fire({
            title: "Oops...",
            text: "Failed to delete product.",
            icon: "error",
          });
        } else {
          const updatedProducts = await fetchProducts();
          setProducts(updatedProducts);
          Swal.fire({
            title: "Deleted!",
            text: "Your Produit has been deleted.",
            icon: "success",
          });
        }
      }

      useEffect(() => {
        if (ok === true) {
          setok(false);
          Delete_Produit(Produit_ID_D);
        }
      }, [Produit_ID_D]);

      return (
        <>
          <Button variant="contained">Modify</Button>
          <Button variant="contained" onClick={Delete}>
            Delete
          </Button>
        </>
      );
    },
  };

  columnsTable.forEach((cl) => {
    const field = { field: cl, headerName: cl, width: 200 };
    columnss.push(field);
  });
  columnss.push(Actionsfield);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      products.forEach((p, i) => {
        p.id = i;
      });
      setrows(products);
    }
  }, [products]);

  async function addProduct(event) {
    event.preventDefault();
    const Refference = textFieldRefference.current.value;
    const Nom = textFieldNom.current.value;
    const Prix_Unit = textFieldPrix_Unit.current.value;
    const Code_Barres = [];
    console.log(textFieldCodeBarre.current.length);
    if (textFieldCodeBarre.current.length === 1) {
      Code_Barres.push(textFieldCodeBarre.current[0].value);
      console.log(textFieldCodeBarre.current[0].value);
    } else {
      textFieldCodeBarre.current.map((tf) => {
        Code_Barres.push(tf.value);
      });
    }
    const uniqueArray = [...new Set(Code_Barres)];

    // Check if the size of the unique array is less than the original array
    const hasDuplicates = uniqueArray.length !== Code_Barres.length;
    if (hasDuplicates) {
      setAlert({ message: "Code_Barres Duplicate.", severity: "error" });
    } else {
      const all = { Refference, Nom, Prix_Unit, Code_Barres };
      console.log(all);
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(all),
      });

      if (!response.ok) {
        setAlert({ message: "Failed to add product.", severity: "error" });
        setTimeout(() => setAlert({ message: "", severity: "" }), 2000);
        throw new Error("Failed to add product");
      }

      const updatedProducts = await fetchProducts();
      setProducts(updatedProducts);
      Swal.fire({
        title: "Produc Added!",
        text: "Product:" + JSON.stringify(all),
        icon: "success",
      });
      setAlert({
        message: "Success! The product has been added.",
        severity: "success",
      });
      if (textFieldCodeBarre.current.length === 1) {
        textFieldCodeBarre.current[0].value = "";
      }
      ref.forEach((input) => (input.current.value = "")); // Clear all text fields
      setCodeBarreFields([{ value: "" }]); // Reset Code_Barre fields
      setTimeout(() => setAlert({ message: "", severity: "" }), 2000);
    }
  }

  const addCodeBarreField = () => {
    setCodeBarreFields([...codeBarreFields, { value: "" }]);
  };

  async function fetchProducts() {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  }

  return (
    <div className={style.All}>
      {alert.message && (
        <div
          style={{
            width: "600px",
            position: "fixed",
            top: "39px",
            right: "20px",
            zIndex: 1000,
          }}
        >
          <Alert severity={alert.severity} style={{ margin: "0 auto" }}>
            {alert.message}
          </Alert>
        </div>
      )}
      <div className={style.New}>
        <Box className={style.textfields}>
          <Box className={style.Code_Barres}>
            {" "}
            {/* Code_Barre Fields */}
            {codeBarreFields.map((field, index) => (
              <TextField
                key={index}
                sx={{
                  bgcolor: "white",
                  marginBottom: "10px",
                }}
                inputRef={(el) => (textFieldCodeBarre.current[index] = el)}
                label={`Code_Barre ${index + 1}`}
                variant="outlined"
              />
            ))}
            <Button variant="contained" onClick={addCodeBarreField}>
              Add More Code_Barre
            </Button>
          </Box>
          {/* Other Fields */}
          <Box className={style.autherFields}>
            {" "}
            {columns.map((c, i) => (
              <TextField
                sx={{ bgcolor: "white", marginRight: "10px" }}
                key={i}
                label={c}
                inputRef={ref[i]}
                id="outlined-basic"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
        <Fab
          className={style.AddButton}
          onClick={addProduct}
          color="primary"
          aria-label="add"
        >
          <AddIcon />
        </Fab>
      </div>
    </div>
  );
}

export default NewProduits;
