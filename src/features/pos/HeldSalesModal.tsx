"use client";

import React, { useState } from "react";
import { usePos } from "./posState";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency } from "@/lib/utils";
import {
  PauseCircle,
  PlayCircle,
  Trash2,
  X,
  Clock,
  ShoppingBag,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function HeldSalesModal({
  open,
  onOpenChange,
  mode = "list", // 'hold' to create new, 'list' to view/restore
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "hold" | "list";
}) {
  const {
    heldSales,
    holdCurrentSale,
    restoreHeldSale,
    deleteHeldSale,
    totalDue,
    selectedCustomer,
  } = usePos();
  const { t } = useI18n();
  const [note, setNote] = useState("");

  const handleHoldConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    holdCurrentSale(note);
    setNote("");
    onOpenChange(false);
  };

  const handleRestore = (id: string) => {
    restoreHeldSale(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4 select-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <PauseCircle className="h-5 w-5 text-amber-500" />
              <span>
                {mode === "hold"
                  ? t("pos.holdModal.holdTitle", "Mettre la Vente en Attente")
                  : t("pos.holdModal.listTitle", "Ventes en Attente")}
              </span>
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            {mode === "hold"
              ? t(
                  "pos.holdModal.holdDesc",
                  "Enregistrez le panier actuel pour servir un autre client",
                )
              : t(
                  "pos.holdModal.listDesc",
                  "Sélectionnez une vente mise en attente pour la réactiver dans le panier",
                )}
          </DialogDescription>
        </DialogHeader>

        {mode === "hold" ? (
          <form onSubmit={handleHoldConfirm} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
              {t("pos.holdModal.currentTotal", "Total actuel :")}{" "}
              <strong>{formatCurrency(totalDue)}</strong>
              {selectedCustomer &&
                ` • ${t("pos.customerModal.title", "Client")} : ${selectedCustomer.fullName}`}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t(
                  "pos.holdModal.referenceNote",
                  "Nom du client ou note distinctive",
                )}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t(
                  "pos.holdModal.notePlaceholder",
                  "Ex: Client pull bleu, commande 14...",
                )}
                className="w-full h-11 px-3.5 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-[0.98]"
            >
              <PauseCircle className="h-5 w-5" />
              <span>
                {t("pos.holdModal.confirmHold", "Mettre en Attente [Entrée]")}
              </span>
            </button>
          </form>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {heldSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t(
                  "pos.holdModal.emptyHeld",
                  "Aucune vente en attente actuellement.",
                )}
              </div>
            ) : (
              heldSales.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-card border border-border flex items-center justify-between hover:border-amber-500/50 transition-colors"
                >
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>
                        {h.note || t("pos.ticketTabs.empty", "Sans note")}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
                        {formatCurrency(h.total)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {h.items.length} {t("pos.itemsCount", "articles")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(h.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRestore(h.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>{t("pos.holdModal.restore", "Reprendre")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHeldSale(h.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title={t("pos.holdModal.delete", "Supprimer")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
