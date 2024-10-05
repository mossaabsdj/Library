// components/ProductList.js
"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import { textAlign } from "@mui/system";

function ProductList({ products }) {
  const scrollContainerRef = useRef(null);

  // Function to handle key presses for scrolling
  const handleKeyDown = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    switch (e.key) {
      case "ArrowDown":
        container.scrollBy({ top: 30, behavior: "smooth" }); // Scroll down
        break;
      case "ArrowUp":
        container.scrollBy({ top: -30, behavior: "smooth" }); // Scroll up
        break;
      case "PageDown":
        container.scrollBy({
          top: container.clientHeight,
          behavior: "smooth",
        }); // Scroll by page down
        break;
      case "PageUp":
        container.scrollBy({
          top: -container.clientHeight,
          behavior: "smooth",
        }); // Scroll by page up
        break;
      case "Home":
        container.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top
        break;
      case "End":
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        }); // Scroll to bottom
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      window.addEventListener("keydown", handleKeyDown);
    };

    const handleBlur = () => {
      window.removeEventListener("keydown", handleKeyDown);
    };

    // Add event listeners on mount and remove on unmount
    handleFocus();
    return handleBlur;
  }, []);
  function SetData(index) {
    console.log("get codde barre" + products[index].Code_Barre);
    var field_Codebarre = document.getElementById("field_Codebarre");
    field_Codebarre.innerText = products[index].Code_Barres;
  }
  return (
    <div className={styles.blurred}>
      <ul id="myList" className={styles.ul} useRef={scrollContainerRef}>
        <li className={styles.li} key={"098"}>
          <div className={styles.Nom}>Name </div>{" "}
          <div className={styles.Prix}>Prix Vente </div>
        </li>
        {products.map((product, index) => (
          <li
            className={styles.li}
            onClick={() => SetData(index)}
            id={product.Code_Barre}
          >
            <div className={styles.Nom}> {product.Nom}</div>{" "}
            <div className={styles.Prix}> {product.Prix_Unit} Da</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductList;
