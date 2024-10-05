"use client";
import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";

export default function DataTable({ rows, columnss }) {
  return (
    <div style={{}}>
      <DataGrid
        rows={rows}
        columns={columnss}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 100 },
          },
        }}
        pageSizeOptions={[5, 100]}
        checkboxSelection
        sx={{
          height: "auto",
          width: "92%",
          margin: "20px auto",
          borderRadius: "15px",
          overflow: "hidden", // Ensures rounded corners for the content inside
          boxShadow: "0 4px 10px rgba(0, 32, 63, 0.3)",
          backgroundColor: "#fff",

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#1E90FF", // DogeBlue background for the header row
            color: "#ffffff", // White text color
          },
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#1E90FF", // DogeBlue background for the header row
            fontWeight: "bold", // Bold text for column names
            fontSize: "16px", // Font size for column names
            borderBottom: "2px solid #004d99", // Bottom border for header cells
          },
          "& .MuiDataGrid-row": {
            borderRadius: "15px", // Set border radius for the DataGrid

            borderBottom: "1px solid #e0e0e0", // Row border for better separation
          },
          "& .MuiDataGrid-root": {
            borderRadius: "15px", // Set border radius for the DataGrid
            overflow: "hidden", // Ensure that the corners are rounded
          },
        }}
      />
    </div>
  );
}
