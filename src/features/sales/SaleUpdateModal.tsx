"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency, playBeep } from "@/lib/utils";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Edit2,
  User,
  FileText,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export function SaleUpdateModal({
  open,
  onOpenChange,
  sale,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
  onSuccess: () => void;
}) {
  const { t } = useI18n();

  const [customerId, setCustomerId] = useState<string>("");
  const [cashierName, setCashierName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<string>("COMPLETED");

  // Quick debt settlement
  const [settleAmount, setSettleAmount] = useState<string>("0");
  const [settlePaymentMethod, setSettlePaymentMethod] =
    useState<string>("CASH");
  const [isSettling, setIsSettling] = useState<boolean>(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && sale) {
      setCustomerId(sale.customerId ? String(sale.customerId) : "");
      setCashierName(sale.cashierName || "Admin");
      setNotes(sale.notes || "");
      setStatus(sale.status || "COMPLETED");
      setSettleAmount(String(sale.remainingAmount || 0));
      setErrorMsg(null);

      // Load customers list for dropdown
      fetch("/api/customers")
        .then((res) => res.json())
        .then((data) => setCustomers(data || []))
        .catch(() => {});
    }
  }, [open, sale]);

  if (!sale) return null;

  const remainingAmount = Number(sale.remainingAmount || 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Update basic sale attributes
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId ? parseInt(customerId, 10) : null,
          cashierName: cashierName.trim() || undefined,
          notes: notes.trim() || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error || "Erreur lors de la mise à jour de la vente.",
        );
      }

      // 2. If user opted to record a debt payment
      const paymentVal = parseFloat(settleAmount) || 0;
      if (isSettling && paymentVal > 0 && remainingAmount > 0) {
        const payRes = await fetch(`/api/sales/${sale.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: paymentVal,
            paymentMethod: settlePaymentMethod,
            notes: `Règlement direct depuis l'édition de vente`,
          }),
        });

        if (!payRes.ok) {
          const payData = await payRes.json();
          throw new Error(
            payData.error || "Erreur lors de l'enregistrement du règlement.",
          );
        }
      }

      playBeep("success");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      playBeep("error");
      setErrorMsg(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-lg w-full">
      <form onSubmit={handleSave} className="space-y-4 select-none">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-primary">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Edit2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                {t("sales.update.title", "Modifier la Vente")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("sales.table.invoice", "N° Ticket / Facture")} :{" "}
                <span className="font-mono font-bold text-foreground">
                  {sale.invoiceNumber}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Customer Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>{t("sales.update.customerSelect", "Client associé")}</span>
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">
              {t(
                "sales.table.walkInCustomer",
                "Client Comptoir (Aucun client assigné)",
              )}
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} {c.phone ? `(${c.phone})` : ""} — Dette:{" "}
                {formatCurrency(c.credit)}
              </option>
            ))}
          </select>
          {remainingAmount > 0 && !customerId && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Attention : Cette vente contient un reste à payer. Il est
              conseillé d'y associer un client pour le suivi des dettes.
            </p>
          )}
        </div>

        {/* Cashier Name & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              {t("sales.details.cashier", "Caissier")}
            </label>
            <input
              type="text"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              {t("sales.table.status", "Statut")}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="COMPLETED">
                {t("sales.filters.completed", "Complété")}
              </option>
              <option value="HELD">
                {t("sales.filters.held", "En attente")}
              </option>
              <option value="RETURNED">
                {t("sales.filters.returned", "Retourné")}
              </option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>{t("sales.update.notesLabel", "Notes / Observations")}</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t(
              "sales.update.notesPlaceholder",
              "Ajouter des remarques sur cette vente...",
            )}
            className="w-full p-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Settle Debt Option if remaining > 0 */}
        {remainingAmount > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSettling}
                onChange={(e) => setIsSettling(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary border-input"
              />
              <span className="text-xs font-bold text-foreground">
                {t("sales.update.settleDebt", "Régler le solde restant")} (
                {formatCurrency(remainingAmount)})
              </span>
            </label>

            {isSettling && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-semibold">
                    {t("sales.update.settleAmount", "Montant à verser")}
                  </label>
                  <input
                    type="number"
                    max={remainingAmount}
                    min={0.01}
                    step="any"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-bold font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-semibold">
                    {t("sales.table.method", "Mode")}
                  </label>
                  <select
                    value={settlePaymentMethod}
                    onChange={(e) => setSettlePaymentMethod(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="CASH">
                      {t("sales.filters.cash", "Espèces")}
                    </option>
                    <option value="CARD">
                      {t("sales.filters.card", "Carte")}
                    </option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {t("sales.details.close", "Fermer")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>
              {t("sales.update.saveButton", "Enregistrer les modifications")}
            </span>
          </button>
        </div>
      </form>
    </Dialog>
  );
}
