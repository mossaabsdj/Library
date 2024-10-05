"use client";
import React, { useState, useRef } from "react";
import style from "@/app/component/Login/page.module.css";
import Link from "next/link"; // Importing Link from next/link

const User = "admin";
const Password = "admin";

function Login() {
  const [user, setUser] = useState(""); // State for storing user input
  const [password, setPassword] = useState(""); // State for storing password input
  const linkRef = useRef(null);
  function Checklogin() {
    if (user === User && password === Password) {
      linkRef.current.click();
    } else {
      alert("Invalid credentials"); // Alert the user if credentials are incorrect
    }
  }

  return (
    <div className={style.All}>
      <div className={style.container}>
        <div className={style.formcontainer + " " + style.logincontainer}>
          <form className={style.form}>
            <h1 className={style.h1}>Connectez-vous</h1>

            <div className={style.socialcontainer}>
              <a href="#" className="fab fa-facebook-f">
                <ion-icon name="logo-facebook"></ion-icon>
              </a>
              <a href="#" className="fab fa-twitter">
                <ion-icon name="logo-twitter"></ion-icon>
              </a>
              <a href="#" className="fab fa-instagram">
                <ion-icon name="logo-instagram"></ion-icon>
              </a>
            </div>
            <span className={style.span}>J'ai un compte</span>
            <input
              id="User"
              onChange={(e) => setUser(e.target.value)}
              className={style.input}
              type="text"
              placeholder="User Name"
            />
            <input
              id="Password"
              onChange={(e) => setPassword(e.target.value)}
              className={style.input}
              type="password"
              placeholder="Password"
            />
            <button
              onClick={Checklogin} // Pass the function reference here
              className={style.button}
              type="button"
            >
              Se Connecter
            </button>
          </form>
        </div>
        <div className={style.overlaycontainer}>
          <div className={style.overlay}>
            <div className={style.overlaypanel + " " + style.overlayright}>
              <h1>Bienvenue!</h1>
              <p>Créez un compte et rejoignez notre communauté</p>
              <button className={style.button} type="button">
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      </div>
      <script
        type="module"
        src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
      ></script>
      <Link ref={linkRef} href="/Menu"></Link>
    </div>
  );
}

export default Login;
