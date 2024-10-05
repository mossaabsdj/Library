"use client";
import style from "./page.module.css";
import { useRouter } from "next/navigation"; // Use the correct import
import DataGrid from "@/app/component/DataGrid/DataGrid";
import { useEffect, useRef } from "react";

function item({ title }) {
  const router = useRouter();
  var button = useRef(null);
  const New = () => {
    if (title.startsWith("Consulter")) {
      button.current.innerText = "Back to Factures";
      router.push(`/${"Factures"}`);
    }
    if (title.startsWith("New")) {
      const result = title.split(" ")[1];
      button.current.innerText = result;
      router.push(`/${result}`);
    } else if (!title.startsWith("New")) {
      console.log("im here 2");
      router.push(`${title}/New${title}`);
    }
  };
  const Home = () => {
    router.push(`/Menu`);
  };
  useEffect(() => {
    if (title.startsWith("Consulter")) {
    } else if (title.startsWith("New")) {
      const result = title.split(" ")[1];
      button.current.innerText = result;
    }
  }, []);
  return (
    <>
      <div className={style.container}>
        <h1>Manage {title}</h1>
        <button className={style.backbutton} onClick={Home}>
          Home
        </button>
        <button id="New" ref={button} className={style.a} onClick={New}>
          New {title}
        </button>
        <form className={style.form}>
          <input
            className={style.input}
            type="text"
            id="profSearch"
            name="profSearch"
            placeholder="Produit"
          ></input>
          <button type="submit" className={style.buttons}>
            Search
          </button>
        </form>
      </div>
    </>
  );
}

export default item;
