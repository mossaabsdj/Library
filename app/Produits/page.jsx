"use client";
import style from "./page.module.css";
import PageDjo from "@/app/component/PageDjo/page";
import DataGrid from "@/app/component/DataGrid/DataGrid";
import CircularProgressWithLabel from "@/app/component/wait/page";
import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Swal from "sweetalert2";
import { Menu, MenuItem, Typography } from "@mui/material";
import { ArrowDropDown } from "@mui/icons-material";
import NewProduit from "@/app/Produits/NewProduits/page";

import Modify from "@/app/component/Modify/page";
import { setTimeout } from "timers";
function item() {
  const [ok, setok] = useState(false);
  const [WhouldUpdate, setWhouldUpdate] = useState(false);
  const [products, setProducts] = useState([]);
  const [Produit_ID, setProduit_ID] = useState();
  const [ModifyVisible, setModifyVisible] = useState(false);
  const [Values, setValues] = useState({});
  const [rows, setrows] = useState([]);
  const [progress, setprogress] = useState(0);
  const [loading, setloading] = useState(true);
  const [NewProduitVisible, setNewProduitVisible] = useState(false);

  var columnsTable = [
    "Nom",

    "Refference",

    "Prix_Unit",
    "Stock_Q",
    "Prix_Achat",
    "Sales_Rapid",
    "Image",
  ];
  var title = "Produits";
  var columnss = [];

  var Actionsfield = {
    field: "Actions",
    headerName: "Actions",
    width: 200,

    renderCell: (params) => {
      async function Delete(event) {
        event.preventDefault();
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
            // console.log("ok" + ok + "+++" + Produit_ID);

            setok(true);
            // console.log("ok" + ok + "+++" + Produit_ID);

            setProduit_ID(params.row.Produit_ID);
            //  console.log("ok" + ok + "+++" + Produit_ID);
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

      function Modify(event) {
        event.preventDefault();
        let colum = "Code_Barre";
        let Row = params.row;
        let id = params.row.Produit_ID;

        setModifyVisible(true);
        setTimeout(() => {
          var button = document.getElementById("Modify");
          button.addEventListener("click", () => {
            setWhouldUpdate(true); // Ensure setWhouldUpdate is properly defined in scope
            setProduit_ID(id);
          });
        }, 2000);

        setValues(Row);
      }

      return (
        <>
          <Button variant="contained" onClick={Modify}>
            Modify
          </Button>
          <Button variant="contained" onClick={Delete}>
            Delete
          </Button>
        </>
      );
    },
  };
  async function Update(Produit_ID) {
    var Code_Barres = [];
    var Image = null;
    var Sales_Rapid = false;
    var ListCode_Barres = document.getElementsByName("Code_Barre");
    var Refference = document.getElementById("Refference").value;
    var Nom = document.getElementById("Nom").value;
    var Prix_Unit = document.getElementById("Prix_Unit").value;
    var checkboxElement = document.getElementById("check");
    console.log("Check" + checkboxElement);
    console.log("Check.checked" + checkboxElement.checked);

    if (checkboxElement.checked) {
      Sales_Rapid = true;
      const fileInput = document.getElementById("file-upload");
      Image = fileInput.files[0].name; // Get the file from the input
    }
    console.log("Image" + Image);
    ListCode_Barres.forEach((codeBarre) => {
      console.log("==" + codeBarre.value);
      if (codeBarre.value === "") {
      } else {
        Code_Barres.push(codeBarre.value);
      }
    });

    if (Code_Barres.every((element) => element.trim() === "")) {
      Swal.fire({
        title: "Oops...",
        text: "Failed to update product without codebarre .",
        icon: "error",
      });
    } else {
      const all = {
        Code_Barres,
        Refference,
        Nom,
        Prix_Unit,
        Produit_ID,
        Sales_Rapid,
        Image,
      };
      console.log(
        " Code_Barres nom ..." + Code_Barres,
        Refference,
        Nom,
        Prix_Unit,
        Produit_ID,
        Sales_Rapid,
        Image
      );
      setModifyVisible(false);
      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(all), // Wrap in an object and stringify
      });
      if (!response.ok) {
        Swal.fire({
          title: "Oops...",
          text: "Failed to update product.",
          icon: "error",
        });
      } else {
        // Fetch updated products
        Swal.fire({
          title: "Updated!",
          text: "Your Produit has been Updated.",
          icon: "success",
        });
        const updatedProducts = await fetchProducts();
        setProducts(updatedProducts);
        setProduit_ID();
      }
    }
  }
  async function Delete_Produit(Produit_ID) {
    console.log(Produit_ID);
    const response = await fetch("/api/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Produit_ID }), // Wrap in an object and stringify
    });
    if (!response.ok) {
      Swal.fire({
        title: "Oops...",
        text: "Failed to Delete product.",
        icon: "error",
      });
    } else {
      // Fetch updated products
      const updatedProducts = await fetchProducts();
      setProducts(updatedProducts);
      Swal.fire({
        title: "Deleted!",
        text: "Your Produit has been deleted.",
        icon: "success",
      });
    }
  }
  async function fetchProducts() {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    return response.json();
  }
  function DisplayModify() {
    setModifyVisible(false);
  }
  columnsTable.map((cl) => {
    if (cl === "Code_Barre") {
      const field = {
        field: cl,
        headerName: cl,
        width: 200,
        renderCell: (params) => {
          const [anchorEl, setAnchorEl] = useState(null);
          const open = Boolean(anchorEl);

          const handleClick = (event) => {
            setAnchorEl(event.currentTarget);
          };

          const handleClose = () => {
            setAnchorEl(null);
          };

          // Extract the array of code bars from params.value
          const codeBars = Array.isArray(params.value)
            ? params.value.map((item) => item.Code_Barre)
            : []; // Ensure we have an array of strings

          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between", // Align elements properly
              }}
            >
              <Typography
                variant="body2"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap", // Prevent text wrapping
                }}
              >
                {codeBars.length > 0 ? codeBars[0] : "No Code Bar"}
              </Typography>
              <Button
                aria-controls="code-bar-menu"
                aria-haspopup="true"
                onClick={handleClick}
                endIcon={<ArrowDropDown />} // Arrow icon on the right side of the button
              />
              <Menu
                id="code-bar-menu"
                anchorEl={anchorEl}
                keepMounted
                open={open}
                onClose={handleClose}
              >
                {codeBars.length < 2 ? (
                  <MenuItem key={codeBars[0]} onClick={handleClose}>
                    {codeBars[0]}
                  </MenuItem>
                ) : (
                  codeBars.map((codeBar, index) => (
                    <MenuItem key={index} onClick={handleClose}>
                      {codeBar}
                    </MenuItem>
                  ))
                )}
              </Menu>
            </div>
          );
        },
      };
      columnss.push(field);
    } else {
      var field = { field: cl, headerName: cl, width: 200 };
      columnss.push(field);
    }
  });
  columnss.push(Actionsfield);
  useEffect(() => {
    if (ok) {
      console.log("here iam");

      setok(false);
      Delete_Produit(Produit_ID);
    } else if (WhouldUpdate) {
      setWhouldUpdate(false);

      Update(Produit_ID);
    }
  }, [Produit_ID]);
  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);

    setloading(false);
  }, []);
  useEffect(() => {
    if (products.length > 0) {
      products.map((p, i) => {
        p.id = i;
      });
      setrows(products);
    }
  }, [products]);
  function visible_NewProduit() {
    setNewProduitVisible(true);
  }
  function visible_NewProduit_off() {
    setNewProduitVisible(false);
  }
  return (
    <>
      {" "}
      <div className={NewProduitVisible ? style.allBlur : style.all}>
        <PageDjo title={title} visible={visible_NewProduit} />
        {ModifyVisible && (
          <Modify Values={Values} displayfunction={DisplayModify} />
        )}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh", // Full viewport height
            }}
          >
            {" "}
            <CircularProgressWithLabel />
          </div>
        ) : (
          <DataGrid columnss={columnss} rows={rows} />
        )}
      </div>
      {NewProduitVisible && <NewProduit Visibleoff={visible_NewProduit_off} />}
    </>
  );
}
export default item;
