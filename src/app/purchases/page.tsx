"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/contexts/I18nContext";
import { useLoading } from "@/contexts/LoadingContext";
import { formatCurrency, generateInvoiceNumber, playBeep } from "@/lib/utils";
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
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

export default function PurchasesPage() {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [purchases, setPurchases] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [items, setItems] = useState<
    {
      productId: number;
      name: string;
      purchasePrice: number;
      quantity: number;
      subtotal: number;
    }[]
  >([]);
  const [paidAmount, setPaidAmount] = useState<string>("0");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Line item add helper
  const [selectedProdToAdd, setSelectedProdToAdd] = useState<string>("");

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchases?page=${page}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
        setTotal(data.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [page]);

  const openNewPurchaseModal = async () => {
    setIsModalOpen(true);
    setErrorMsg(null);
    setInvoiceNumber(generateInvoiceNumber("ACH"));
    setItems([]);
    setPaidAmount("0");

    try {
      const [supRes, prodRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/products?limit=300"),
      ]);
      if (supRes.ok) {
        const s = await supRes.json();
        setSuppliers(s);
        if (s.length > 0) setSupplierId(String(s[0].id));
      }
      if (prodRes.ok) {
        const p = await prodRes.json();
        setProducts(p.products || []);
        if (p.products?.length > 0)
          setSelectedProdToAdd(String(p.products[0].id));
      }
    } catch {}
  };

  const handleAddLineItem = () => {
    const prodId = parseInt(selectedProdToAdd, 10);
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const existingIdx = items.findIndex((i) => i.productId === prodId);
    const cost =
      Number(prod.purchasePrice) || Number(prod.unitPrice) * 0.7 || 50;

    if (existingIdx > -1) {
      const updated = [...items];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].subtotal =
        updated[existingIdx].quantity * updated[existingIdx].purchasePrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          name: prod.name,
          purchasePrice: cost,
          quantity: 1,
          subtotal: cost,
        },
      ]);
    }
  };

  const updateItem = (
    index: number,
    field: "quantity" | "purchasePrice",
    val: number,
  ) => {
    const updated = [...items];
    updated[index][field] = val;
    updated[index].subtotal =
      updated[index].quantity * updated[index].purchasePrice;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
  const paidNum = parseFloat(paidAmount) || 0;
  const remainingDebt = Math.max(0, totalAmount - paidNum);

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const sId = parseInt(supplierId, 10);
    if (!sId) {
      setErrorMsg(
        t("purchases.supplierLabel", "Veuillez sélectionner un fournisseur."),
      );
      return;
    }

    if (items.length === 0) {
      setErrorMsg(
        t("purchases.addItemTitle", "Veuillez ajouter au moins un article."),
      );
      return;
    }

    await withLoading(
      async () => {
        setSaving(true);
        try {
          const payload = {
            supplierId: sId,
            invoiceNumber: invoiceNumber.trim(),
            date: purchaseDate,
            totalAmount,
            paidAmount: paidNum,
            items: items.map((i) => ({
              productId: i.productId,
              purchasePrice: i.purchasePrice,
              quantity: i.quantity,
              subtotal: i.subtotal,
            })),
          };

          const res = await fetch("/api/purchases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Erreur d'enregistrement");
          }

          playBeep("success");
          setIsModalOpen(false);
          await loadPurchases();
        } catch (err: any) {
          playBeep("error");
          setErrorMsg(err.message);
        } finally {
          setSaving(false);
        }
      },
      t(
        "purchases.purchaseSky",
        "Enregistrement du bon d'achat et mise à jour du stock...",
      ),
    );
  };

  return (
    <AppLayout
      title={t("purchases.title", "Achats Fournisseurs & Réapprovisionnement")}
    >
      <div className="space-y-4 select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              <span>{t("purchases.title", "Bons d'Achat Fournisseurs")}</span>
              <Badge
                variant="secondary"
                className="font-mono bg-primary/10 text-primary"
              >
                {total} {t("common.details", "factures")}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "purchases.modalDesc",
                "Entrées en stock, factures d'achat et suivi des dettes fournisseurs",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={openNewPurchaseModal}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>{t("purchases.newPurchase", "+ Nouveau Bon d'Achat")}</span>
          </button>
        </div>

        {/* Purchases Table */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-border">
                <TableHead className="text-foreground font-bold">
                  {t("purchases.invoiceNumber", "N° Bon / Facture")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("common.date", "Date")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("purchases.supplier", "Fournisseur")}
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  {t("purchases.items", "Articles")}
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  {t("common.total", "Total Achat")}
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  {t("purchases.paidAmount", "Montant Payé")}
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  {t("purchases.remainingDebt", "Reste Dû")}
                </TableHead>
                <TableHead className="text-center text-foreground font-bold">
                  {t("common.status", "Statut")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingState
                  columns={8}
                  text={t("common.loading", "Chargement des achats...")}
                />
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground text-xs"
                  >
                    {t(
                      "purchases.noPurchases",
                      "Aucun bon d'achat enregistré.",
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((p) => {
                  const remaining = Number(p.remainingAmount);
                  const isPaid = remaining === 0;

                  return (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-bold text-primary">
                        {p.invoiceNumber}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.date).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="font-semibold text-foreground">
                        {p.supplier?.name || "Fournisseur Inconnu"}
                      </TableCell>

                      <TableCell className="text-end font-mono text-xs text-muted-foreground">
                        {p.items?.length || 0} art.
                      </TableCell>

                      <TableCell className="text-end font-mono font-bold text-foreground">
                        {formatCurrency(p.totalAmount)}
                      </TableCell>

                      <TableCell className="text-end font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(p.paidAmount)}
                      </TableCell>

                      <TableCell className="text-end font-mono font-bold">
                        {remaining > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {formatCurrency(remaining)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={isPaid ? "default" : "destructive"}
                          className={`text-[10px] ${
                            isPaid
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {isPaid
                            ? t("purchases.paidFull", "Payé Total")
                            : t(
                                "purchases.creditInProgress",
                                "Crédit En Cours",
                              )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <form
          onSubmit={handleSubmitPurchase}
          className="space-y-4 select-none max-w-2xl"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Truck className="h-5 w-5 text-primary" />
                <span>
                  {t("purchases.modalTitle", "Nouveau Bon d'Achat Fournisseur")}
                </span>
              </DialogTitle>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DialogDescription className="text-muted-foreground text-xs">
              {t(
                "purchases.modalDesc",
                "Enregistrez les entrées en stock et les factures d'achat",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("purchases.supplierLabel", "Fournisseur *")}
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.company ? `(${s.company})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("purchases.invoiceLabel", "N° Facture / Bon *")}
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs font-mono font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("purchases.dateLabel", "Date d'Achat")}
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Add Item Line Section */}
          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-2">
            <span className="text-xs font-bold text-foreground">
              {t(
                "purchases.addItemTitle",
                "Ajouter un Article au Bon d'Achat :",
              )}
            </span>
            <div className="flex gap-2">
              <select
                value={selectedProdToAdd}
                onChange={(e) => setSelectedProdToAdd(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ({formatCurrency(p.unitPrice)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="h-9 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t("common.create", "Ajouter")}</span>
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-card">
            <table className="w-full text-xs">
              <thead className="bg-muted/80 text-muted-foreground sticky top-0 border-b border-border">
                <tr>
                  <th className="p-2 text-start">
                    {t("product.name", "Produit")}
                  </th>
                  <th className="p-2 text-center w-24">
                    {t("purchases.purchasePrice", "Prix Achat")}
                  </th>
                  <th className="p-2 text-center w-20">
                    {t("common.quantity", "Quantité")}
                  </th>
                  <th className="p-2 text-end w-28">
                    {t("pos.subtotal", "Sous-Total")}
                  </th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      {t(
                        "common.empty",
                        "Aucun article ajouté au bon d'achat.",
                      )}
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-muted/40">
                      <td className="p-2 font-medium text-foreground">
                        {it.name}
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={it.purchasePrice}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "purchasePrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full h-7 px-1 text-center font-mono rounded bg-background border border-input text-foreground"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "quantity",
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          className="w-full h-7 px-1 text-center font-mono font-bold rounded bg-background border border-input text-foreground"
                        />
                      </td>
                      <td className="p-2 text-end font-mono font-bold text-foreground">
                        {formatCurrency(it.subtotal)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payments */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/50 border border-border">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("purchases.paidAmount", "Montant Payé Immédiatement (DA)")}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-1 text-end flex flex-col justify-center">
              <div className="text-xs text-muted-foreground">
                {t("common.total", "Total")} :{" "}
                <strong className="text-foreground font-mono text-sm">
                  {formatCurrency(totalAmount)}
                </strong>
              </div>
              <div className="text-xs text-muted-foreground">
                {t("purchases.remainingDebt", "Reste Dû")} :{" "}
                <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                  {formatCurrency(remainingDebt)}
                </strong>
              </div>
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
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
            >
              {t("common.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {t("purchases.newPurchase", "Enregistrer le Bon d'Achat")}
              </span>
            </button>
          </div>
        </form>
      </Dialog>
    </AppLayout>
  );
}
