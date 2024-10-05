import React from "react";
import style from "./page.module.css"; // Assuming you move the styles to a CSS file
import { useHistory } from "react-router-dom";

function Menu() {
  return (
    <div className={style.container}>
      <div className={style.box}>
        <h1 className={style.Title}>Library</h1>

        <ul className={style.ul}>
          <li className={style.li}>
            <a href="Sales\NewSales">New Sales</a>
          </li>
          <li className={style.li}>
            <a href="Produits">Produits</a>
          </li>
          <li className={style.li}>
            <a href="Sales">Sales</a>
          </li>
          <li className={style.li}>
            <a href="Factures">Factures</a>
          </li>
          <li className={style.li}>
            <a href="Stock">Stock</a>
          </li>
          <li className={style.li}>
            <a href="Dashboard">Benefits</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Menu;
