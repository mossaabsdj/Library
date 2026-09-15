"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/contexts/I18nContext";
import { useLoading } from "@/contexts/LoadingContext";
import { formatNumber, playBeep } from "@/lib/utils";
import {
  Layers,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableLoadingState } from "@/components/ui/table-skeleton";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function StockMovementsPage() {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [movements, setMovements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Adjustment Modal
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [adjProductId, setAdjProductId] = useState<string>("");
  const [adjQuantity, setAdjQuantity] = useState<string>("1");
  const [adjDirection, setAdjDirection] = useState<"IN" | "OUT">("IN");
  const [adjReason, setAdjReason] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjError, setAdjError] = useState<string | null>(null);

  const loadMovements = async () => {
    setLoading(true);
    try {
      let url = `/api/stock/movements?page=${page}&limit=50`;
      if (selectedType !== "ALL") url += `&type=${selectedType}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [page, selectedType]);

  const openAdjustmentModal = async () => {
    setAdjModalOpen(true);
    setAdjError(null);
    try {
      const res = await fetch("/api/products?limit=200");
      if (res.ok) {
        const data = await res.json();
        setProductsList(data.products || []);
        if (data.products?.length > 0 && !adjProductId) {
          setAdjProductId(String(data.products[0].id));
        }
      }
    } catch {}
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjError(null);

    const prodId = parseInt(adjProductId, 10);
    const qty = parseInt(adjQuantity, 10);

    if (!prodId || isNaN(qty) || qty <= 0 || !adjReason.trim()) {
      setAdjError(
        "Veuillez renseigner un produit, une quantité positive et un motif.",
      );
      return;
    }

    const finalQty = adjDirection === "IN" ? qty : -qty;

    await withLoading(
      async () => {
        setAdjSaving(true);
        try {
          const res = await fetch("/api/stock/adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: prodId,
              adjustmentQuantity: finalQty,
              reason: adjReason.trim(),
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Erreur d'ajustement");
          }

          playBeep("success");
          setAdjModalOpen(false);
          setAdjReason("");
          setAdjQuantity("1");
          await loadMovements();
        } catch (err: any) {
          playBeep("error");
          setAdjError(err.message);
        } finally {
          setAdjSaving(false);
        }
      },
      t("stock.applyingCorrection", "Application de la correction de stock..."),
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            {t("stock.types.PURCHASE", "Achat Fournisseur")}
          </span>
        );
      case "SALE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            {t("stock.types.SALE", "Vente Comptoir")}
          </span>
        );
      case "SALE_RETURN":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            {t("stock.types.SALE_RETURN", "Retour Vente")}
          </span>
        );
      case "PURCHASE_RETURN":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            {t("stock.types.PURCHASE_RETURN", "Retour Achat")}
          </span>
        );
      case "ADJUSTMENT_IN":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
            {t("stock.types.ADJUSTMENT_IN", "Ajustement Entrant (+)")}
          </span>
        );
      case "ADJUSTMENT_OUT":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            {t("stock.types.ADJUSTMENT_OUT", "Ajustement Sortant (-)")}
          </span>
        );
      case "INITIAL_STOCK":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
            {t("stock.types.INITIAL_STOCK", "Stock Initial")}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
            {type}
          </span>
        );
    }
  };

  return (
    <AppLayout title={t("stock.title", "Mouvements de Stock & Traçabilité")}>
      <div className="space-y-4 select-none">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              <span>{t("stock.title", "Journal des Mouvements de Stock")}</span>
              <Badge
                variant="secondary"
                className="font-mono bg-primary/10 text-primary border-primary/20"
              >
                {total} {t("stock.movementsCount", "mouvements")}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "stock.subtitle",
                "Historique immuable de chaque variation de stock (Achats, Ventes, Retours, Inventaires)",
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAdjustmentModal}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>{t("stock.adjustment", "Ajuster un Stock (+ / -)")}</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="p-3 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              {t("stock.movementType", "Type de Mouvement :")}
            </span>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="ALL">
                {t("stock.allMovements", "Tous les Mouvements")}
              </option>
              <option value="SALE">
                {t("stock.types.SALE", "Ventes Comptoir")}
              </option>
              <option value="PURCHASE">
                {t("stock.types.PURCHASE", "Achats Fournisseurs")}
              </option>
              <option value="SALE_RETURN">
                {t("stock.types.SALE_RETURN", "Retours Ventes")}
              </option>
              <option value="ADJUSTMENT_IN">
                {t("stock.types.ADJUSTMENT_IN", "Ajustements Entrants (+)")}
              </option>
              <option value="ADJUSTMENT_OUT">
                {t("stock.types.ADJUSTMENT_OUT", "Ajustements Sortants (-)")}
              </option>
              <option value="INITIAL_STOCK">
                {t("stock.types.INITIAL_STOCK", "Stock Initial")}
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadMovements}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
            title={t("pos.refresh", "Actualiser")}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-border">
                <TableHead className="w-36 text-foreground font-bold">
                  {t("stock.dateAndTime", "Date & Heure")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("stock.product", "Produit")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("stock.type", "Type")}
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  {t("stock.quantity", "Quantité")}
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  {t("stock.previousStock", "Stock Avant")}
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  {t("stock.newStock", "Nouveau Stock")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("stock.refReason", "Référence / Motif")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("stock.operator", "Opérateur")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingState
                  columns={8}
                  text={t("stock.loadingLog", "Chargement du journal...")}
                />
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground text-xs"
                  >
                    {t(
                      "stock.emptyLog",
                      "Aucun mouvement de stock enregistré.",
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => {
                  const isPositive =
                    m.type === "PURCHASE" ||
                    m.type === "SALE_RETURN" ||
                    m.type === "ADJUSTMENT_IN" ||
                    m.type === "INITIAL_STOCK";

                  return (
                    <TableRow
                      key={m.id}
                      className="border-border hover:bg-muted/50"
                    >
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(m.createdAt).toLocaleString("fr-FR")}
                      </TableCell>

                      <TableCell className="font-bold text-foreground">
                        <div>{m.product?.name || "Produit Inconnu"}</div>
                        {m.product?.reference && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Ref: {m.product.reference}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>{getTypeBadge(m.type)}</TableCell>

                      <TableCell className="text-end font-mono font-black">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </TableCell>

                      <TableCell className="text-end font-mono text-muted-foreground text-xs">
                        {formatNumber(m.previousStock)}
                      </TableCell>

                      <TableCell className="text-end font-mono text-foreground font-bold text-xs">
                        {formatNumber(m.newStock)}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {m.notes || m.reference || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs font-semibold text-foreground">
                        {m.user || "Admin"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <Dialog open={adjModalOpen} onOpenChange={setAdjModalOpen}>
        <form onSubmit={handleSaveAdjustment} className="space-y-4 select-none">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Layers className="h-5 w-5 text-primary" />
                <span>
                  {t("stock.modalTitle", "Ajustement Manuel de Stock")}
                </span>
              </DialogTitle>
              <button
                type="button"
                onClick={() => setAdjModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DialogDescription>
              {t(
                "stock.modalDesc",
                "Correction d'inventaire, casse, perte ou régularisation de stock",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("stock.productConcerned", "Produit Concerné *")}
              </label>
              <select
                value={adjProductId}
                onChange={(e) => setAdjProductId(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({t("stock.currentStock", "Stock actuel :")}{" "}
                    {p.stockQuantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("stock.correctionType", "Type de Correction *")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjDirection("IN")}
                    className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                      adjDirection === "IN"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                        : "bg-background border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>{t("stock.inEntry", "Entrée (+)")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjDirection("OUT")}
                    className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                      adjDirection === "OUT"
                        ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:text-rose-300 ring-2 ring-rose-500/20"
                        : "bg-background border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4" />
                    <span>{t("stock.outExit", "Sortie (-)")}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("stock.qtyToAdjust", "Quantité à Ajuster *")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("stock.reasonRequired", "Motif Obligatoire *")}
              </label>
              <textarea
                rows={2}
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                required
                placeholder={t(
                  "stock.reasonPlaceholder",
                  "Ex: Casse lors du déchargement, comptage inventaire annuel...",
                )}
                className="w-full p-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {adjError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
              <span>{adjError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setAdjModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold transition-colors"
            >
              {t("common.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              disabled={adjSaving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {t("stock.validateAdjustment", "Valider l'Ajustement")}
              </span>
            </button>
          </div>
        </form>
      </Dialog>
    </AppLayout>
  );
}
