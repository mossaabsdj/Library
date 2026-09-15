"use client";

import React, { useState } from "react";
import { usePos, PosTicket } from "./posState";
import { useI18n } from "@/contexts/I18nContext";
import { Plus, X, ShoppingBag, Edit2, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function PosTicketTabs() {
  const {
    tickets,
    activeTicketId,
    switchTicket,
    createNewTicket,
    closeTicket,
    renameTicket,
  } = usePos();
  const { t } = useI18n();

  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  const startRename = (ticket: PosTicket, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTicketId(ticket.id);
    setEditNameValue(ticket.name);
  };

  const saveRename = (
    ticketId: string,
    e?: React.FormEvent | React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    if (editNameValue.trim()) {
      renameTicket(ticketId, editNameValue.trim());
    }
    setEditingTicketId(null);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin select-none">
      {tickets.map((ticket) => {
        const isActive = ticket.id === activeTicketId;
        const itemCount = ticket.cart.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        const total = ticket.cart.reduce((sum, item) => sum + item.subtotal, 0);
        const displayName = ticket.selectedCustomer
          ? `${ticket.name} (${ticket.selectedCustomer.fullName})`
          : ticket.name;

        return (
          <div
            key={ticket.id}
            onClick={() => switchTicket(ticket.id)}
            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 border shrink-0 ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 font-bold"
                : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShoppingBag
                className={`h-3.5 w-3.5 ${isActive ? "text-primary-foreground" : "text-primary"}`}
              />

              {editingTicketId === ticket.id ? (
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(ticket.id);
                      if (e.key === "Escape") setEditingTicketId(null);
                    }}
                    autoFocus
                    className="w-24 px-1.5 py-0.5 rounded text-xs text-foreground bg-background border border-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={(e) => saveRename(ticket.id, e)}
                    className="p-0.5 hover:bg-primary-foreground/20 rounded text-inherit"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <span className="truncate max-w-[120px]">{displayName}</span>
              )}
            </div>

            {/* Badge for item count & total */}
            {ticket.cart.length > 0 ? (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                {itemCount} | {formatCurrency(total)}
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  isActive
                    ? "bg-primary-foreground/10 text-primary-foreground/80"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t("pos.ticketTabs.empty", "Vide")}
              </span>
            )}

            {/* Rename button (hover) */}
            {editingTicketId !== ticket.id && (
              <button
                type="button"
                onClick={(e) => startRename(ticket, e)}
                className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity ${
                  isActive
                    ? "text-primary-foreground/80 hover:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={t("pos.ticketTabs.rename", "Renommer le ticket")}
              >
                <Edit2 className="h-2.5 w-2.5" />
              </button>
            )}

            {/* Close Ticket Button */}
            {(tickets.length > 1 || ticket.cart.length > 0) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTicket(ticket.id);
                }}
                className={`p-0.5 rounded-full hover:bg-black/15 dark:hover:bg-white/20 transition-colors ${
                  isActive
                    ? "text-primary-foreground/80 hover:text-primary-foreground"
                    : "text-muted-foreground hover:text-destructive"
                }`}
                title={t("pos.ticketTabs.close", "Fermer ce ticket")}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add New Ticket Button */}
      <button
        type="button"
        onClick={() => createNewTicket()}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-card text-primary border border-dashed border-primary/40 hover:bg-primary/10 transition-colors shrink-0 shadow-sm"
        title={t(
          "pos.ticketTabs.newTicket",
          "Créer une nouvelle vente en parallèle",
        )}
      >
        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
        <span>{t("pos.newTicket", "+ Vente")}</span>
      </button>
    </div>
  );
}
