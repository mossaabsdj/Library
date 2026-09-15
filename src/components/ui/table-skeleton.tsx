"use client";

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { LogoLoader } from "./logo-loader";

export function TableSkeletonRows({
  columns = 7,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <TableRow key={rIdx} className="hover:bg-transparent">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <TableCell key={cIdx} className="py-3.5">
              <div
                className="h-4 rounded-md bg-muted/70 animate-pulse"
                style={{
                  width: `${60 + ((rIdx * 17 + cIdx * 23) % 35)}%`,
                }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function TableLoadingState({
  columns = 7,
  message,
  text,
}: {
  columns?: number;
  message?: string;
  text?: string;
}) {
  const displayMessage = message || text || "Chargement des données...";
  return (
    <TableRow>
      <TableCell colSpan={columns} className="py-12 text-center">
        <LogoLoader size="sm" message={displayMessage} />
      </TableCell>
    </TableRow>
  );
}
