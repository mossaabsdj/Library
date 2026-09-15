"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/contexts/I18nContext";
import { useLoading } from "@/contexts/LoadingContext";
import { formatCurrency, playBeep } from "@/lib/utils";
import {
  Building2,
  Search,
  Plus,
  Coins,
  X,
  CheckCircle2,
  AlertCircle,
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

export default function SuppliersPage() {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Supplier Create/Edit Modal
  const [supModalOpen, setSupModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [savingSup, setSavingSup] = useState(false);
  const [supError, setSupError] = useState<string | null>(null);

  // Supplier Debt Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedSupForPay, setSelectedSupForPay] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNotes, setPayNotes] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const url = search.trim()
        ? `/api/suppliers?search=${encodeURIComponent(search.trim())}`
        : `/api/suppliers`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadSuppliers, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const openNewSupplierModal = () => {
    setName("");
    setCompany("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setSupError(null);
    setSupModalOpen(true);
  };

  const openPayDebtModal = (s: any) => {
    setSelectedSupForPay(s);
    setPayAmount(String(s.debt));
    setPayMethod("CASH");
    setPayNotes("");
    setPayError(null);
    setPayModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupError(null);

    if (!name.trim()) {
      setSupError("Le nom du fournisseur est obligatoire.");
      return;
    }

    await withLoading(async () => {
      setSavingSup(true);
      try {
        const payload = {
          name: name.trim(),
          company: company.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        };

        const res = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur d'enregistrement");
        }

        playBeep("success");
        setSupModalOpen(false);
        await loadSuppliers();
      } catch (err: any) {
        playBeep("error");
        setSupError(err.message);
      } finally {
        setSavingSup(false);
      }
    }, "Enregistrement du fournisseur...");
  };

  const handlePaySupplierDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError("Veuillez saisir un montant supérieur à 0.");
      return;
    }

    await withLoading(async () => {
      setPaySaving(true);
      try {
        const res = await fetch("/api/suppliers/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId: selectedSupForPay.id,
            amount: amt,
            paymentMethod: payMethod,
            notes: payNotes.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur de paiement");
        }

        playBeep("success");
        setPayModalOpen(false);
        await loadSuppliers();
      } catch (err: any) {
        playBeep("error");
        setPayError(err.message);
      } finally {
        setPaySaving(false);
      }
    }, "Paiement de la dette fournisseur...");
  };

  return (
    <AppLayout
      title={t("suppliers.title", "Fournisseurs & Dettes Fournisseurs")}
    >
      <div className="space-y-4 select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span>
                {t("suppliers.title", "Fichier Fournisseurs & Dettes")}
              </span>
              <Badge
                variant="secondary"
                className="font-mono bg-primary/10 text-primary border-primary/20"
              >
                {suppliers.length}{" "}
                {t("suppliers.suppliersCount", "fournisseurs")}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "suppliers.subtitle",
                "Gestion des fournisseurs, suivi des factures d'achat et règlements des dettes",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={openNewSupplierModal}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>{t("suppliers.newSupplier", "+ Nouveau Fournisseur")}</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="p-3 rounded-2xl bg-card border border-border shadow-sm flex items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                "common.search",
                "Rechercher par nom de fournisseur, société, téléphone...",
              )}
              className="w-full h-9 ps-9 pe-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-border">
                <TableHead className="w-16 text-foreground font-bold">
                  ID
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  Fournisseur
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  Société
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  Téléphone
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  Adresse
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  Achats
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  Dette Restante
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingState
                  columns={8}
                  text="Chargement des fournisseurs..."
                />
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-slate-500 text-xs"
                  >
                    Aucun fournisseur enregistré.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((s) => {
                  const debt = Number(s.debt);

                  return (
                    <TableRow
                      key={s.id}
                      className="border-border hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-muted-foreground font-bold">
                        #{s.id}
                      </TableCell>

                      <TableCell className="font-bold text-foreground">
                        {s.name}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-semibold">
                        {s.company || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {s.phone || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {s.address || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-end font-mono text-xs text-foreground font-semibold">
                        {s._count?.purchases || 0}
                      </TableCell>

                      <TableCell className="text-end font-mono font-black">
                        {debt > 0 ? (
                          <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-900/50">
                            {formatCurrency(debt)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            0.00 DA
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-end">
                        {debt > 0 && (
                          <button
                            type="button"
                            onClick={() => openPayDebtModal(s)}
                            className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Coins className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                            <span>{t("suppliers.settleDebt", "Régler")}</span>
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* New Supplier Modal */}
      <Dialog open={supModalOpen} onOpenChange={setSupModalOpen}>
        <form onSubmit={handleSaveSupplier} className="space-y-4 select-none">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Building2 className="h-5 w-5 text-primary" />
                <span>{t("suppliers.newSupplier", "Nouveau Fournisseur")}</span>
              </DialogTitle>
              <button
                type="button"
                onClick={() => setSupModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DialogDescription>
              Coordonnées et informations de contact de votre fournisseur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nom du Contact / Responsable *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: SARL Distribution / Mohamed"
                className="w-full h-11 px-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("suppliers.company", "Entreprise / Raison Sociale")}
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: Grossiste Nord Algérie"
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("suppliers.phone", "Téléphone")}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550 00 00 00"
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fournisseur@email.com"
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("suppliers.address", "Adresse")}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Zone industrielle, Alger..."
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("common.notes", "Notes")}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions de livraison, remises..."
                className="w-full p-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {supError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
              <span>{supError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSupModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={savingSup}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Enregistrer le Fournisseur</span>
            </button>
          </div>
        </form>
      </Dialog>

      {/* Supplier Debt Payment Modal */}
      {selectedSupForPay && (
        <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
          <form
            onSubmit={handlePaySupplierDebt}
            className="space-y-4 select-none"
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Coins className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span>
                    {t(
                      "suppliers.settleDebtModal",
                      "Régler la Dette Fournisseur",
                    )}
                  </span>
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <DialogDescription>
                {t("suppliers.supplierLabel", "Fournisseur :")}{" "}
                <strong className="text-foreground">
                  {selectedSupForPay.name}
                </strong>
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-800 dark:text-orange-300">
                {t(
                  "suppliers.currentDebtLabel",
                  "Total Restant Dû au Fournisseur :",
                )}
              </span>
              <span className="text-xl font-black text-orange-600 dark:text-orange-400 font-mono">
                {formatCurrency(selectedSupForPay.debt)}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t(
                    "suppliers.amountPaid",
                    "Montant Versé au Fournisseur (DA) *",
                  )}
                </label>
                <input
                  type="number"
                  step="any"
                  max={Number(selectedSupForPay.debt)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="w-full h-12 px-3 rounded-xl bg-background border border-input text-xl font-mono font-black text-amber-600 dark:text-amber-400 text-end focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("suppliers.paymentMethod", "Mode de Règlement")}
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="CASH">
                    {t("pos.paymentModal.cash", "Espèces")}
                  </option>
                  <option value="CHECK">
                    {t("pos.paymentModal.other", "Chèque Bancaire")}
                  </option>
                  <option value="BANK_TRANSFER">
                    {t("pos.paymentModal.other", "Virement Bancaire")}
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t(
                    "suppliers.settleNote",
                    "Remarque / N° Chèque (Optionnel)",
                  )}
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Ex: Paiement facture n° 458 par chèque..."
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {payError && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold transition-colors"
              >
                {t("common.cancel", "Annuler")}
              </button>
              <button
                type="submit"
                disabled={paySaving}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-600/20 transition-all active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {t("suppliers.validatePayment", "Valider le Versement")}
                </span>
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </AppLayout>
  );
}
