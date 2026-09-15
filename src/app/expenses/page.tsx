"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/contexts/I18nContext";
import { useLoading } from "@/contexts/LoadingContext";
import { formatCurrency, playBeep } from "@/lib/utils";
import {
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building,
  Zap,
  Car,
  Briefcase,
  Wrench,
  HelpCircle,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { TableLoadingState } from "@/components/ui/table-skeleton";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ExpensesPage() {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // New Expense Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("RENT");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const url =
        selectedCategory !== "ALL"
          ? `/api/expenses?category=${selectedCategory}`
          : `/api/expenses`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0) {
      setErrorMsg(
        t(
          "expenses.validationError",
          "Veuillez renseigner un titre et un montant supérieur à 0.",
        ),
      );
      return;
    }

    await withLoading(
      async () => {
        setSaving(true);
        try {
          const res = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              category,
              amount: amt,
              paymentMethod,
              notes: notes.trim() || undefined,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Erreur d'enregistrement");
          }

          playBeep("success");
          setModalOpen(false);
          setTitle("");
          setAmount("");
          setNotes("");
          await loadExpenses();
        } catch (err: any) {
          playBeep("error");
          setErrorMsg(err.message);
        } finally {
          setSaving(false);
        }
      },
      t("expenses.saveSky", "Enregistrement de la dépense..."),
    );
  };

  const totalExpensesAmount = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );

  const getCategoryLabel = (cat: string) => {
    return t(`expenses.categoryOptions.${cat}`, cat);
  };

  return (
    <AppLayout title={t("expenses.title", "Dépenses & Charges")}>
      <div className="space-y-6 select-none max-w-7xl">
        {/* Header Summary & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">
                {t("expenses.title", "Dépenses d'Exploitation")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  "expenses.subtitle",
                  "Enregistrez une charge d'exploitation (loyer, salaires, électricité...)",
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
              <span className="text-xs text-muted-foreground block">
                {t("common.total", "Total")} :
              </span>
              <span className="text-lg font-black font-mono text-destructive">
                {formatCurrency(totalExpensesAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setModalOpen(true);
              }}
              className="h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>{t("expenses.newExpense", "+ Nouvelle Dépense")}</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: "ALL", label: t("common.all", "Toutes") },
            { id: "RENT", label: t("expenses.categoryOptions.RENT", "Loyer") },
            {
              id: "ELECTRICITY",
              label: t(
                "expenses.categoryOptions.ELECTRICITY",
                "Électricité / Gaz",
              ),
            },
            {
              id: "TRANSPORT",
              label: t("expenses.categoryOptions.TRANSPORT", "Transport"),
            },
            {
              id: "SALARY",
              label: t("expenses.categoryOptions.SALARY", "Salaires"),
            },
            {
              id: "MAINTENANCE",
              label: t("expenses.categoryOptions.MAINTENANCE", "Entretien"),
            },
            {
              id: "SUPPLIES",
              label: t("expenses.categoryOptions.SUPPLIES", "Fournitures"),
            },
            {
              id: "OTHER",
              label: t("expenses.categoryOptions.OTHER", "Autre"),
            },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Expenses Table */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-border">
                <TableHead className="w-32 text-foreground font-bold">
                  {t("common.date", "Date")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("expenses.nameLabel", "Libellé / Titre")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("expenses.categoryLabel", "Catégorie")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("expenses.paymentMethodLabel", "Mode Paiement")}
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  {t("common.amount", "Montant")}
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  {t("common.notes", "Notes")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingState
                  columns={6}
                  text={t("common.loading", "Chargement des dépenses...")}
                />
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground text-xs"
                  >
                    {t("expenses.noExpenses", "Aucune dépense enregistrée.")}
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/50">
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {new Date(e.date).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="font-bold text-foreground">
                      {e.title}
                    </TableCell>

                    <TableCell>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                        {getCategoryLabel(e.category)}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {e.paymentMethod}
                    </TableCell>

                    <TableCell className="text-end font-mono font-black text-destructive">
                      {formatCurrency(e.amount)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {e.notes || (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* New Expense Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <form onSubmit={handleCreateExpense} className="space-y-4 select-none">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <DollarSign className="h-5 w-5 text-primary" />
                <span>
                  {t("expenses.newExpense", "Nouvelle Dépense / Charge")}
                </span>
              </DialogTitle>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DialogDescription className="text-muted-foreground text-xs">
              {t(
                "expenses.subtitle",
                "Enregistrez une charge d'exploitation (loyer, salaires, électricité...)",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("expenses.nameLabel", "Libellé / Titre de la Dépense *")}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={t(
                  "expenses.namePlaceholder",
                  "Ex: Facture Sonelgaz Mars, Loyer du local...",
                )}
                className="w-full h-11 px-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("expenses.categoryLabel", "Catégorie")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="RENT">
                    {t("expenses.categoryOptions.RENT", "Loyer Local")}
                  </option>
                  <option value="ELECTRICITY">
                    {t(
                      "expenses.categoryOptions.ELECTRICITY",
                      "Électricité / Eau / Gaz",
                    )}
                  </option>
                  <option value="TRANSPORT">
                    {t(
                      "expenses.categoryOptions.TRANSPORT",
                      "Transport / Carburant",
                    )}
                  </option>
                  <option value="SALARY">
                    {t(
                      "expenses.categoryOptions.SALARY",
                      "Salaires & Personnel",
                    )}
                  </option>
                  <option value="MAINTENANCE">
                    {t(
                      "expenses.categoryOptions.MAINTENANCE",
                      "Entretien & Travaux",
                    )}
                  </option>
                  <option value="SUPPLIES">
                    {t(
                      "expenses.categoryOptions.SUPPLIES",
                      "Fournitures & Emballages",
                    )}
                  </option>
                  <option value="OTHER">
                    {t("expenses.categoryOptions.OTHER", "Autre Charge")}
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("expenses.amountLabel", "Montant (DA) *")}
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm font-mono font-bold text-destructive focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("expenses.paymentMethodLabel", "Mode de Règlement")}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="CASH">
                  {t("pos.paymentModal.cash", "Espèces")}
                </option>
                <option value="CARD">
                  {t("pos.paymentModal.card", "Carte Bancaire")}
                </option>
                <option value="CHECK">
                  {t("pos.paymentModal.other", "Chèque / Virement")}
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("expenses.notesLabel", "Notes / Justificatif (Optionnel)")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t("common.notes", "Remarques complémentaires...")}
                className="w-full p-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
            >
              {t("common.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-primary/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{t("common.save", "Enregistrer")}</span>
            </button>
          </div>
        </form>
      </Dialog>
    </AppLayout>
  );
}
