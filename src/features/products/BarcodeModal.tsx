"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Barcode as BarcodeIcon,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { playBeep } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { LogoLoader } from "@/components/ui/logo-loader";

export function BarcodeModal({
  open,
  onOpenChange,
  productId,
  productName,
  barcodeToEdit,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productName: string;
  barcodeToEdit?: { id: number; code: string } | null;
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCode(barcodeToEdit ? barcodeToEdit.code : "");
      setErrorMsg(null);
    }
  }, [open, barcodeToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setErrorMsg(
        t("barcode.emptyError", "Le code-barres ne peut pas être vide"),
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (barcodeToEdit) {
        // Edit barcode
        const res = await fetch(`/api/barcodes/${barcodeToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmed }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(
            err.error || t("barcode.updateError", "Erreur de mise à jour"),
          );
        }
      } else {
        // Add new barcode
        const res = await fetch("/api/barcodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, code: trimmed }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || t("barcode.addError", "Erreur d'ajout"));
        }
      }

      playBeep("success");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      playBeep("error");
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4 select-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <BarcodeIcon className="h-5 w-5 text-primary" />
              <span>
                {barcodeToEdit
                  ? t("barcode.editTitle", "Modifier Code-barres")
                  : t("barcode.addTitle", "Ajouter un Code-barres")}
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
          <DialogDescription className="text-muted-foreground">
            {t("product.name", "Produit")} :{" "}
            <strong className="text-foreground">{productName}</strong> (
            {t("barcode.produitId", "Produit_ID")}: {productId})
          </DialogDescription>
        </DialogHeader>

        {/* Structure requirement: Code_Barre_ID, Produit_ID, Code_Barre */}
        <div className="space-y-3 p-3.5 rounded-xl bg-card border border-border text-xs">
          {barcodeToEdit && (
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="text-muted-foreground font-mono">
                {t("barcode.codeBarreId", "Code_Barre_ID")}
              </span>
              <span className="font-mono font-bold text-foreground">
                {barcodeToEdit.id}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 border-b border-border">
            <span className="text-muted-foreground font-mono">
              {t("barcode.produitId", "Produit_ID")}
            </span>
            <span className="font-mono font-bold text-primary">
              {productId}
            </span>
          </div>

          <div>
            <label className="text-foreground font-mono font-bold block mb-1">
              {t("barcode.codeBarre", "Code_Barre *")}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t(
                "barcode.placeholder",
                "Scanner ou saisir le code-barre...",
              )}
              required
              className="w-full h-11 px-3 rounded-xl bg-background border border-input text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              autoFocus
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
          >
            {t("barcode.cancel", "Annuler")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-primary/20 active:scale-95"
          >
            {loading ? (
              <LogoLoader size="sm" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>{t("barcode.save", "Enregistrer")}</span>
          </button>
        </div>
      </form>
    </Dialog>
  );
}
