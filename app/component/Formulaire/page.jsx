import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";

import style from "@/app/component/Formulaire/page.module.css";

function form({ columns, Buttons }) {
  return (
    <>
      <h1>New Produits</h1>
      <Box
        component="form"
        sx={{
          "& .MuiTextField-root": { m: 2, width: "20ch" },
        }}
        noValidate
        autoComplete="off"
      >
        {columns.map((c, i) => (
          <TextField
            sx={{ bgcolor: "white" }}
            key={i}
            label={c}
            id="outlined-basic"
            variant="outlined"
          />
        ))}
      </Box>
      <Fab color="primary" aria-label="add">
        <AddIcon />
      </Fab>
    </>
  );
}
export default form;
