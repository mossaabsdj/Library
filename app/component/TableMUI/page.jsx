"use client";
import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Button from "@mui/material/Button";

function Row({ row, Thead, Thead_History, functionm }) {
  const [open, setOpen] = React.useState(false);

  var Thistory = row.History;

  return (
    <React.Fragment>
      <TableRow name="history" sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        {Thead.map((tc, i) =>
          i === 0 ? (
            <TableCell key={i}>{row[tc]}</TableCell>
          ) : (
            <TableCell key={i} align="right">
              {row[tc]}
            </TableCell>
          )
        )}
        <TableCell align="right">
          <Button
            sx={{ marginRight: "20px" }}
            id={Object.values(row)[0]}
            name="Button_Delete"
            variant="contained"
          >
            {" "}
            Delete
          </Button>
          <Button
            id={Object.values(row)[0]}
            name="Button_Modify"
            variant="contained"
          >
            {" "}
            Update
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                History
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    {Thead_History.map((th, i) =>
                      i === 2 ? (
                        <TableCell key={i} align="right">
                          {th}
                        </TableCell>
                      ) : (
                        <TableCell key={i}>{th}</TableCell>
                      )
                    )}
                    <TableCell>action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Thistory.map((historyRow, j) => (
                    <TableRow key={Object.values(historyRow)[0]}>
                      {Thead_History.map((hr, i) =>
                        i === 2 ? (
                          <TableCell key={i} align="right">
                            {historyRow[hr]}
                          </TableCell>
                        ) : (
                          <TableCell key={i}>{historyRow[hr]}</TableCell>
                        )
                      )}

                      <TableCell>
                        <Button
                          onClick={(e) => functionm(e)}
                          id={Object.values(historyRow)[0]}
                          name="Button_Delete_history"
                          variant="contained"
                        >
                          {" "}
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function CollapsibleTable({
  Thead,
  object,
  Thead_History,
  unction,
}) {
  //Thead.push("action");
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            {Thead.map((th, i) =>
              i === 0 ? (
                <TableCell key={i}>{th}</TableCell>
              ) : (
                <TableCell key={i} align="right">
                  {th}
                </TableCell>
              )
            )}
            <TableCell align="right">action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {object.map((row, index) => (
            <Row
              key={row.id} // Use a unique key if available, like row.id
              row={row}
              Thead={Thead}
              Thead_History={Thead_History}
              functionm={unction}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
