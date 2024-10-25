"use client";
import React, { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import style from "@/app/component/FactTable/page.module.css";
import { useRef } from "react";
function ccyFormat(num) {
  return `${num.toFixed(2)}`;
}

function priceRow(qty, unit) {
  return qty * unit;
}

function subtotal(items) {
  return items.map(({ Sum }) => Sum).reduce((sum, i) => sum + i, 0);
}

export default function SpanningTable({ rowss, Thead, DeleteFunction }) {
  const t = useRef(null);
  rowss.map((object) => {
    if (object.Prix_Achat) {
      object.Sum = priceRow(object.Quantite, object.Prix_Achat);
    } else {
      object.Sum = priceRow(object.Quantite, object.Prix_Vente);
    }
  });
  const [rows, setRows] = useState(rowss);
  const [editCell, setEditCell] = useState({ rowIndex: null, colName: null });

  useEffect(() => {
    setRows(rowss);
    if (rowss.length >= 3) {
      console.log("here");
      t.current.scrollTop = t.current.scrollHeight;
    }
  }, [rowss]);

  function handleInputChange(rowIndex, colName, event) {
    const value = parseFloat(event.target.value) || 0;
    const updatedRows = [...rows];
    const row = updatedRows[rowIndex];

    if (colName === "Quantite") {
      row.Quantite = value;
      row.Sum = priceRow(row.Quantite, row.Prix_Achat || row.Prix_Vente);
    } else if (colName === "Prix_Achat") {
      row.Prix_Achat = value;
      row.Sum = priceRow(row.Quantite, row.Prix_Achat);
    } else if (colName === "Prix_Vente") {
      row.Prix_Vente = value;
      row.Sum = priceRow(row.Quantite, row.Prix_Vente);
    }

    setRows(updatedRows);
  }

  function handleCellClick(rowIndex, colName) {
    setEditCell({ rowIndex, colName });
  }

  function handleBlur() {
    setEditCell({ rowIndex: null, colName: null });
  }

  const invoiceSubtotal = subtotal(rows);

  function print() {
    window.print();
  }

  return (
    <div className={style.All}>
      <TableContainer ref={t} className={style.Table} component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="spanning table">
          <TableHead>
            <TableRow className={style.Head}>
              <TableCell
                className={style.Details}
                id="Details"
                align="center"
                colSpan={3}
              >
                Details
              </TableCell>
              <TableCell className={style.element} align="right"></TableCell>
              <TableCell className={style.elements} align="right">
                <p className={style.p}>Library Djebien</p>
              </TableCell>
              <TableCell className={style.BS}>
                <Button
                  className={style.print}
                  variant="contained"
                  onClick={print}
                >
                  Print
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Nº</TableCell>
              {Thead.map((th, i) => (
                <TableCell key={i} align={i === 0 ? "left" : "right"}>
                  {th}
                </TableCell>
              ))}
              <TableCell className={style.element}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, N) => (
              <TableRow key={row.id || N}>
                {" "}
                {/* Ensure unique key */}
                <TableCell>{N + 1}</TableCell>
                {Thead.map((th, i) => (
                  <TableCell
                    key={i}
                    align={i === 0 ? "left" : "right"}
                    onClick={() => handleCellClick(N, th)}
                  >
                    {editCell.rowIndex === N && editCell.colName === th ? (
                      <input
                        value={row[th]}
                        onChange={(event) => handleInputChange(N, th, event)}
                        onBlur={handleBlur}
                        autoFocus
                        style={{
                          border: "none",
                          width: "30px",
                          height: "30px",
                        }} // Remove border
                      />
                    ) : (
                      row[th]
                    )}
                  </TableCell>
                ))}
                <TableCell className={style.element}>
                  <Button
                    className={style.Button_Delete}
                    id={N} // Ensure ID is unique and properly formatted
                    name="Button_Delete"
                    variant="contained"
                    onClick={() => DeleteFunction(N)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={7} />
            </TableRow>
            <TableRow className={style.Last}>
              <TableCell rowSpan={2} colSpan={2} />
              <TableCell align="center" className={style.Montant} colSpan={1}>
                Montant_Totatl
              </TableCell>
              <TableCell
                id="Montant_Totatl"
                className={style.Montant_Totatl}
                align="right"
              >
                {ccyFormat(invoiceSubtotal)}DA
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
            <TableRow className={style.Last}>
              {" "}
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
