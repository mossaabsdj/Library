"use client";
import { useEffect, useRef, useState } from "react";
import style from "@/app/component/SlideMenu/page.module.css";
import "boxicons/css/boxicons.min.css"; // Import Boxicons CSS
import { Slider } from "@mui/material";
function SliderMenu() {
  const slider = useRef();
  const [open, setopen] = useState(false);

  function sliderfunction() {
    if (open) {
      setopen(false);
    } else {
      setopen(true);
    }
  }
  return (
    <div className={style.all}>
      <div className={style.body}>
        {open ? (
          <nav
            ref={slider}
            onMouseLeave={sliderfunction}
            className={style.sidebar}
          >
            <header className={style.header}>
              <div className={style.imagetext}>
                <span className={style.Spanimage}>
                  <img className={style.image} src="/logo.jpg" alt="" />
                </span>
                <div className={style.textheadertext}>
                  <span className={style.name}>Library</span>
                  <span className={style.Profession}>Djebien</span>
                </div>
              </div>
              <i onClick={sliderfunction} class="bx bx-chevron-right"></i>{" "}
            </header>

            <div className={style.menubar}>
              <div className={style.menu}>
                <li className={style.SearchBox}>
                  <a href="">
                    <i class="bx bx-search"></i>{" "}
                    <input type="search" placeholder="Search.." />{" "}
                  </a>
                </li>
                <ul className={style.menulinks}>
                  <li className={style.navlink}>
                    <a href="">
                      <i class="bx bx-home-alt"></i>
                      <span className={style.litext}>Dashboard</span>
                    </a>
                  </li>
                  <li className={style.navlink}>
                    <a href="">
                      <i class="bx bx-home-alt"></i>
                      <span className={style.litext}>Dashboard</span>
                    </a>
                  </li>{" "}
                </ul>
              </div>
              <div className={style.bottom}>
                <li className={style.bottomli}>
                  <a href="">
                    <i class="bx bx-log-out icon"></i>
                    <span className={style.litext}>Logout</span>
                  </a>
                </li>
              </div>
            </div>
          </nav>
        ) : (
          <nav
            onMouseEnter={sliderfunction}
            ref={slider}
            style={{ width: "80PX" }}
            className={style.sidebar}
          >
            <header className={style.header}>
              <div className={style.imagetext}>
                <span className={style.Spanimage}>
                  <img className={style.image} src="/logo.jpg" alt="" />
                </span>
                <div className={style.textheadertext}></div>
              </div>
              <i onClick={sliderfunction} class="bx bx-chevron-right"></i>{" "}
            </header>

            <div className={style.menubar}>
              <div className={style.menu}>
                <li className={style.SearchBox}>
                  <a href="">
                    <i class="bx bx-search"></i>{" "}
                    <input type="search" placeholder="Search.." />{" "}
                  </a>
                </li>
                <ul className={style.menulinks}>
                  <li className={style.navlink}>
                    <a href="">
                      <i class="bx bx-home-alt"></i>
                    </a>
                  </li>
                </ul>
              </div>
              <div className={style.bottom}>
                <li className={style.bottomli}>
                  <a href="">
                    <i class="bx bx-log-out icon"></i>
                  </a>
                </li>
              </div>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
export default SliderMenu;
