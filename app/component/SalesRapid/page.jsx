"use client";
import * as React from "react";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import { useEffect, useRef, useState } from "react";
import style from "@/app/component/SalesRapid/page.module.css";
import { height, width } from "@mui/system";

export default function TitlebarBelowImageList({ OnAdd_Rapid }) {
  const [Products, setProducts] = useState([]);
  const listRef = useRef(null);
  const onclick = (event, Product) => {
    console.log("Code_Barre:", Product.Code_Barre);
    OnAdd_Rapid(Product.Code_Barre);
  };
  const handleKeyDown = (event) => {
    const index = parseInt(event.key) - 1; // Convert key to index (0-based)
    if (index >= 0 && index < Products.length) {
      console.log("Code_Barre:", Products[index].Code_Barre);
    }
  };

  async function fetchProducts() {
    const response = await fetch("/api/Sales/SalesRapid");
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  }

  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);
  }, []);

  useEffect(() => {
    const div = listRef.current;
    if (div) {
      div.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (div) {
        div.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [Products]);

  return (
    <div
      tabIndex={0}
      ref={listRef}
      style={{ outline: "none", marginTop: "0%" }}
    >
      <ImageList sx={{ width: "400px", height: "800px" }}>
        {Products.map((Product, index) => (
          <ImageListItem sx={{ width: "180px" }} key={Product.Produit_ID}>
            <img
              className={style.image}
              src={"/uploads/" + Product.Image}
              alt={Product.Nom}
              loading="lazy"
              onClick={(event) => onclick(event, Product)}
            />
            <span>Click:{index + 1}</span>

            <ImageListItemBar
              sx={{
                fontSize: "20px", // Adjust this value as needed
                color: "black",
                "& .MuiImageListItemBar-title": {
                  fontSize: "22px", // Size for the title
                  fontWeight: "bold",
                },
                "& .MuiImageListItemBar-subtitle": {
                  fontSize: "18px", // Size for the subtitle
                  color: "red",
                  fontWeight: "bold",
                },
              }}
              title={Product.Nom + " " + Product.Refference}
              subtitle={<span>Prix: {Product.Prix_Unit}</span>}
              position="below"
            />
          </ImageListItem>
        ))}
      </ImageList>
    </div>
  );
}
