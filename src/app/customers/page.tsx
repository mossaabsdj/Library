"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/contexts/I18nContext";
import { useLoading } from "@/contexts/LoadingContext";
import { formatCurrency, playBeep } from "@/lib/utils";
import {
  Users,
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

export default function CustomersPage() {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [withDebtOnly, setWithDebtOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Customer Create/Edit Modal
  const [custModalOpen, setCustModalOpen] = useState(false);
  const [custToEdit, setCustToEdit] = useState<any | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState("50000");
  const [notes, setNotes] = useState("");
  const [savingCust, setSavingCust] = useState(false);
  const [custError, setCustError] = useState<string | null>(null);

  // Debt Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedCustForPay, setSelectedCustForPay] = useState<any | null>(
    null,
  );
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNotes, setPayNotes] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      let url = `/api/customers?`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
      if (withDebtOnly) url += `withDebtOnly=true`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 200);
    return () => clearTimeout(timer);
  }, [search, withDebtOnly]);

  const openNewCustomerModal = () => {
    setCustToEdit(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCreditLimit("50000");
    setNotes("");
    setCustError(null);
    setCustModalOpen(true);
  };

  const openDebtPaymentModal = (c: any) => {
    setSelectedCustForPay(c);
    setPayAmount(String(c.credit));
    setPayMethod("CASH");
    setPayNotes("");
    setPayError(null);
    setPayModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustError(null);

    if (!fullName.trim()) {
      setCustError("Le nom du client est obligatoire.");
      return;
    }

    await withLoading(async () => {
      setSavingCust(true);
      try {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            creditLimit: parseFloat(creditLimit) || 0,
            notes: notes.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur lors de la création");
        }

        playBeep("success");
        setCustModalOpen(false);
        await loadCustomers();
      } catch (err: any) {
        playBeep("error");
        setCustError(err.message);
      } finally {
        setSavingCust(false);
      }
    }, "Enregistrement du client...");
  };

  const handleRecordDebtPayment = async (e: React.FormEvent) => {
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
        const res = await fetch("/api/customers/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: selectedCustForPay.id,
            amount: amt,
            paymentMethod: payMethod,
            notes: payNotes.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur de règlement");
        }

        playBeep("success");
        setPayModalOpen(false);
        await loadCustomers();
      } catch (err: any) {
        playBeep("error");
        setPayError(err.message);
      } finally {
        setPaySaving(false);
      }
    }, "Validation du règlement client...");
  };

  return (
    <AppLayout
      title={t("customers.title", "Clients & Gestion des Dettes (Crédits)")}
    >
      <div className="space-y-4 select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <span>{t("customers.title", "Fichier Clients & Crédits")}</span>
              <Badge
                variant="secondary"
                className="font-mono bg-primary/10 text-primary border-primary/20"
              >
                {customers.length} {t("customers.customersCount", "clients")}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "customers.subtitle",
                "Suivi des comptes clients, historique des achats et encaissement des dettes",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={openNewCustomerModal}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>{t("customers.newCustomer", "+ Nouveau Client")}</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="p-3 rounded-2xl bg-card border border-border shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                "pos.customerModal.searchPlaceholder",
                "Rechercher par nom ou numéro de téléphone...",
              )}
              className="w-full h-9 ps-9 pe-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={withDebtOnly}
              onChange={(e) => setWithDebtOnly(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <span>
              {t(
                "customers.withDebtOnly",
                "Afficher uniquement les clients endettés (Crédit > 0)",
              )}
            </span>
          </label>
        </div>

        {/* Customers Table */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-border">
                <TableHead className="w-16 text-foreground font-bold">
                  ID
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  Nom & Prénom
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  Téléphone
                </TableHead>
                <TableHead className="text-foreground font-bold">
                  Adresse
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  Ventes
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  Dette Actuelle
                </TableHead>
                <TableHead className="text-end text-foreground font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingState
                  columns={7}
                  text="Chargement des clients..."
                />
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-slate-500 text-xs"
                  >
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => {
                  const debt = Number(c.credit);

                  return (
                    <TableRow
                      key={c.id}
                      className="border-border hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-muted-foreground font-bold">
                        #{c.id}
                      </TableCell>

                      <TableCell className="font-bold text-foreground">
                        {c.fullName}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {c.phone || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {c.address || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-end font-mono text-xs text-foreground font-semibold">
                        {c._count?.sales || 0}
                      </TableCell>

                      <TableCell className="text-end font-mono font-black">
                        {debt > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-900/50">
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
                            onClick={() => openDebtPaymentModal(c)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Coins className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>
                              {t("customers.settleDebt", "Encaisser")}
                            </span>
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

      {/* New Customer Modal */}
      <Dialog open={custModalOpen} onOpenChange={setCustModalOpen}>
        <form onSubmit={handleSaveCustomer} className="space-y-4 select-none">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Users className="h-5 w-5 text-primary" />
                <span>{t("customers.newCustomer", "Nouveau Client")}</span>
              </DialogTitle>
              <button
                type="button"
                onClick={() => setCustModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DialogDescription>
              Enregistrez les coordonnées et le plafond de crédit du client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("pos.customerModal.fullName", "Nom & Prénom *")}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Ex: Karim Benali"
                className="w-full h-11 px-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("pos.customerModal.phone", "Téléphone")}
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
                  placeholder="client@email.com"
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("customers.address", "Adresse")}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse du client"
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("customers.creditLimit", "Plafond de Crédit Autorisé (DA)")}
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-sm font-mono font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {custError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
              <span>{custError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCustModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={savingCust}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Enregistrer le Client</span>
            </button>
          </div>
        </form>
      </Dialog>

      {/* Debt Payment Modal */}
      {selectedCustForPay && (
        <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
          <form
            onSubmit={handleRecordDebtPayment}
            className="space-y-4 select-none"
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {t(
                      "customers.settleDebtModal",
                      "Encaisser Règlement de Dette",
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
                {t("customers.clientLabel", "Client :")}{" "}
                <strong className="text-foreground">
                  {selectedCustForPay.fullName}
                </strong>
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                {t("customers.currentDebtLabel", "Dette Actuelle :")}
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(selectedCustForPay.credit)}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t(
                    "customers.amountPaid",
                    "Montant Versé par le Client (DA) *",
                  )}
                </label>
                <input
                  type="number"
                  step="any"
                  max={Number(selectedCustForPay.credit)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="w-full h-12 px-3 rounded-xl bg-background border border-input text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 text-end focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("customers.paymentMethod", "Mode de Règlement")}
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="CASH">
                    {t("pos.paymentModal.cash", "Espèces")}
                  </option>
                  <option value="CARD">
                    {t("pos.paymentModal.card", "Carte Bancaire")}
                  </option>
                  <option value="CHECK">
                    {t("pos.paymentModal.other", "Chèque")}
                  </option>
                  <option value="BANK_TRANSFER">
                    {t("pos.paymentModal.other", "Virement Bancaire")}
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {t("customers.settleNote", "Remarque / N° Reçu (Optionnel)")}
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Ex: Versement partiel reçu en caisse..."
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
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {t("customers.validatePayment", "Valider l'Encaissement")}
                </span>
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </AppLayout>
  );
}
