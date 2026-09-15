"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePos } from "./posState";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency, playBeep } from "@/lib/utils";
import { useLoading } from "@/contexts/LoadingContext";
import { LogoLoader } from "@/components/ui/logo-loader";
import {
  Coins,
  Banknote,
  CreditCard,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function PaymentModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (saleData: any) => void;
}) {
  const { cart, totalDue, globalDiscount, selectedCustomer, clearCart } =
    usePos();
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "CREDIT" | "OTHER"
  >("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setReceivedAmount(String(totalDue));
      setPaymentMethod("CASH");
      setErrorMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, totalDue]);

  const received = parseFloat(receivedAmount) || 0;
  const changeDue = Math.max(0, received - totalDue);
  const remainingDebt = Math.max(0, totalDue - received);

  const addCash = (amount: number) => {
    const current = parseFloat(receivedAmount) || 0;
    setReceivedAmount(String(current + amount));
  };

  const setExact = () => {
    setReceivedAmount(String(totalDue));
  };

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg(t("pos.cartEmpty", "Le panier est vide."));
      return;
    }

    if (paymentMethod === "CREDIT" && !selectedCustomer) {
      setErrorMsg(
        t(
          "pos.paymentModal.creditCustomerRequired",
          "Veuillez sélectionner un client pour une vente à crédit.",
        ),
      );
      playBeep("error");
      return;
    }

    if (remainingDebt > 0 && paymentMethod !== "CREDIT" && !selectedCustomer) {
      setErrorMsg(
        t(
          "pos.paymentModal.insufficientAmountDebtWarning",
          "Montant insuffisant. Un client est requis pour imputer le reste dû en crédit.",
        ),
      );
      playBeep("error");
      return;
    }

    setIsSubmitting(true);

    try {
      await withLoading(
        async () => {
          const payload = {
            customerId: selectedCustomer?.id || null,
            items: cart.map((item) => ({
              productId: item.productId,
              name: item.name || "Produit",
              reference: item.reference || null,
              barcode: item.barcode || null,
              unitPrice: item.unitPrice,
              purchasePrice: item.purchasePrice || 0,
              quantity: item.quantity,
              maxStock: item.maxStock || 0,
              discount: item.discount || 0,
              subtotal: item.subtotal || item.unitPrice * item.quantity,
              image: item.image || null,
            })),
            totalAmount: totalDue,
            discountAmount: globalDiscount || 0,
            taxAmount: 0,
            finalAmount: totalDue,
            paidAmount: received >= totalDue ? totalDue : received,
            paymentMethod: paymentMethod,
            notes: null,
          };

          const res = await fetch("/api/pos/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Erreur lors du règlement.");
          }

          const saleData = await res.json();
          playBeep("success");
          clearCart();
          onOpenChange(false);
          onSuccess(saleData);
        },
        t(
          "pos.paymentModal.finishSaleSky",
          "Finalisation de la vente et impression du ticket...",
        ),
      );
    } catch (err: any) {
      playBeep("error");
      setErrorMsg(err.message || "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shortcut key handling: Enter to submit, Escape to close
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleCheckout();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form
        onSubmit={handleCheckout}
        onKeyDown={onKeyDown}
        className="space-y-4 select-none max-w-lg text-foreground"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Coins className="h-5 w-5" />
              </div>
              <span>
                {t("pos.paymentModal.title", "Règlement de la Vente")}
              </span>
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            {t(
              "pos.paymentModal.description",
              "Total à régler et sélection du mode de paiement",
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Display Total Due Prominently */}
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
          <span className="font-bold text-sm text-primary uppercase tracking-wider">
            {t("pos.paymentModal.amountToPay", "Total à Payer")}
          </span>
          <span className="font-black text-3xl text-primary font-mono">
            {formatCurrency(totalDue)}
          </span>
        </div>

        {/* Payment Methods Selector */}
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              {
                id: "CASH",
                label: t("pos.paymentModal.cash", "Espèces"),
                icon: Banknote,
              },
              {
                id: "CARD",
                label: t("pos.paymentModal.card", "Carte"),
                icon: CreditCard,
              },
              {
                id: "CREDIT",
                label: t("pos.paymentModal.credit", "Crédit"),
                icon: UserCheck,
              },
              {
                id: "OTHER",
                label: t("pos.paymentModal.other", "Autre"),
                icon: Coins,
              },
            ] as const
          ).map((m) => {
            const Icon = m.icon;
            const isSelected = paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Customer status notice for credit */}
        {paymentMethod === "CREDIT" && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              selectedCustomer
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            <UserCheck className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
              {selectedCustomer ? (
                <span>
                  {t(
                    "pos.paymentModal.selectedCustomerInfo",
                    "Client sélectionné :",
                  )}{" "}
                  <strong>{selectedCustomer.fullName}</strong> (
                  {t("pos.paymentModal.currentDebt", "Dette actuelle :")}{" "}
                  {formatCurrency(selectedCustomer.credit)})
                </span>
              ) : (
                <span>
                  {t(
                    "pos.paymentModal.noCustomerWarning",
                    "Attention: Aucun client sélectionné. Un client est requis pour le crédit.",
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Amount Received Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>{t("pos.paymentModal.receivedAmount", "Montant Reçu")}</span>
            <button
              type="button"
              onClick={setExact}
              className="text-primary hover:underline font-mono text-xs font-semibold"
            >
              {t("pos.paymentModal.exactAmount", "Montant Exact")}
            </button>
          </label>
          <input
            ref={inputRef}
            type="number"
            step="any"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            className="w-full h-14 px-4 rounded-xl bg-background border-2 border-input text-foreground font-mono text-2xl font-black text-end focus:border-primary focus:outline-none transition-all"
            placeholder="0"
          />
        </div>

        {/* Fast Cash Preset Buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {[100, 200, 500, 1000, 2000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addCash(preset)}
              className="h-9 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-mono text-xs font-bold border border-border transition-colors"
            >
              +{preset}
            </button>
          ))}
        </div>

        {/* Live Change or Remaining Debt calculation */}
        <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground">
            {remainingDebt > 0 ? (
              <span className="text-destructive font-bold">
                {t("pos.paymentModal.remainingCredit", "Reste Dû (Crédit)")}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {t("pos.paymentModal.changeDue", "Monnaie à Rendre")}
              </span>
            )}
          </span>
          <span
            className={`text-xl font-black font-mono ${
              remainingDebt > 0
                ? "text-destructive"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {remainingDebt > 0
              ? formatCurrency(remainingDebt)
              : formatCurrency(changeDue)}
          </span>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Validation Button Enter */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-extrabold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
        >
          {isSubmitting ? (
            <LogoLoader size="sm" />
          ) : (
            <>
              <CheckCircle2 className="h-6 w-6" />
              <span>
                {t(
                  "pos.paymentModal.validateSale",
                  "Valider la Vente [Entrée]",
                )}
              </span>
            </>
          )}
        </button>
      </form>
    </Dialog>
  );
}
