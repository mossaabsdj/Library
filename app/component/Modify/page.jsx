"use client";
import * as React from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useEffect, useRef, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import styles from "./page.module.css"; // Import your CSS module
import { style } from "@mui/system";

const RedButton = styled(Button)(({ theme }) => ({
  backgroundColor: "red",
  color: "white",
  "&:hover": {
    backgroundColor: "darkred",
  },
  position: "absolute",
  top: 0,
  right: 0,
}));

export default function DynamicForm({ Values, displayfunction }) {
  const textfields = useRef([]);
  const textfieldsCodeBarres = useRef([]);
  const [nbr_codebarres, setnbr_codebarres] = useState(["1", "2"]);
  const [FileName, setFileName] = useState("");
  const [checked, setchecked] = useState(true);

  useEffect(() => {
    textfieldsCodeBarres.current = [];
    f();
    setnbr_codebarres(Values.Code_Barre);
    setTimeout(() => {
      ff();
    }, 1);
  }, [Values]);

  const columns = ["Refference", "Nom", "Prix_Unit"];
  const f = () => {
    textfields.current.map((t, i) => {
      t.value = Object.values(Values)[i + 2];
    });
  };

  const ff = () => {
    const codeBarresArray = Object.values(Values.Code_Barre);
    textfieldsCodeBarres.current.forEach((t, index) => {
      if (t && codeBarresArray[index - 1]) {
        t.value = codeBarresArray[index - 1].Code_Barre;
      } else {
        console.error(
          `Text field or code bar reference is missing at index ${index}`
        );
      }
    });
  };
  const handleFileChange = (event) => {
    console.log(event.target);
    const file = event.target.files[0];
    if (file) {
      console.log("Selected file:", file.name);
      setFileName(file.name);
      const formData = new FormData();
      formData.append("file", file);

      fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          console.log("File uploaded successfully:", data);
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
        });
    }
  };

  const addCodeBarreField = () => {
    setnbr_codebarres([...nbr_codebarres, ""]);
  };

  const checkbox = (event) => {
    setchecked(event.target.checked);
    if (!event.target.checked) {
      setFileName("");
    }
    console.log(event.target.checked);
  };
  return (
    <Box className={styles.formContainer}>
      <RedButton
        onClick={displayfunction}
        variant="contained"
        startIcon={<CloseIcon />}
      />

      <h1 className={styles.header}>Modify Produit</h1>
      <form>
        <Grid container className={styles.gridContainer}>
          <Grid item xs={6} className={styles.leftColumn}>
            {nbr_codebarres.map((v, i) => (
              <TextField
                name="Code_Barre"
                inputRef={(R) => (textfieldsCodeBarres.current[i + 1] = R)}
                className={styles.codeBarreField}
                label={"Code_Barre" + (i + 1)}
                id={v.Code_Barre}
                fullWidth
                variant="outlined"
                key={`code-barre-${i}`}
              />
            ))}
            <Button
              variant="contained"
              onClick={addCodeBarreField}
              className={styles.addCodeBarreButton}
            >
              Add More Code_Barre
            </Button>
          </Grid>
          <Grid item xs={6} className={styles.rightColumn}>
            {columns.map((column, index) => (
              <Box className={styles.columnBox} key={`column-box-${index}`}>
                <TextField
                  label={column}
                  id={column.replace(" ", "_")}
                  fullWidth
                  variant="outlined"
                  inputRef={(R) => (textfields.current[index] = R)}
                  key={`text-field-${index}`}
                />
              </Box>
            ))}
            <FormControlLabel
              control={
                <Checkbox id="check" onChange={checkbox} defaultChecked />
              }
              label="Sales_Rapid"
            />
            {checked ? (
              <div>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <label htmlFor="file-upload">
                  <Button variant="contained" component="span">
                    Upload File
                  </Button>
                </label>
                <label className={styles.label}>{FileName}</label>
              </div>
            ) : null}
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          id="Modify"
          fullWidth
          className={styles.modifyButton}
        >
          Modify
        </Button>
      </form>
    </Box>
  );
}
