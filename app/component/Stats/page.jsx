"use client";
import Image from "next/image";

import PanierIcon from "@/public/panier.png";
import style from "@/app/component/Stats/page.module.css";
import { useEffect, useState } from "react";
function Stats({ montant_total, numbr }) {
  const [Montant_Total, setMontant_Total] = useState();
  const [Numbr, setNumbr] = useState();

  return (
    <>
      <div className={style.all}>
        <div className={style.label}>
          <div className={style.edge}></div>
          <h3 className={style.title}>Total:</h3>
          <Image
            className={style.icon}
            src="/panier.png" // Reference the image from the public folder
            alt="Panier Icon"
            width={40} // Set the width of the image
            height={40} // Set the height of the image
          />
        </div>
        <div className={style.label}>
          <div className={style.edge}></div>
          <h3 className={style.title}>Total:</h3>
          <Image
            className={style.icon}
            src="/contrer.png" // Reference the image from the public folder
            alt="countrer Icon"
            width={40} // Set the width of the image
            height={40} // Set the height of the image
          />
        </div>
        <div className={style.label}>
          <div className={style.edge}></div>
          <h3 className={style.title}>Total:</h3>
        </div>
      </div>
    </>
  );
}
export default Stats;
