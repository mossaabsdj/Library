"use client";

import React, { useState, useEffect } from "react";
import { usePos } from "./posState";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency, playBeep } from "@/lib/utils";
import { Users, Search, UserPlus, Check, X, Phone } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function CustomerSelectModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { selectedCustomer, setSelectedCustomer } = usePos();
  const { t } = useI18n();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New customer quick form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const url = search.trim()
        ? `/api/customers?search=${encodeURIComponent(search.trim())}`
        : `/api/customers`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCustomers();
      setShowAddForm(false);
    }
  }, [open, search]);

  const handleSelect = (customer: any | null) => {
    if (customer) {
      setSelectedCustomer({
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        credit: Number(customer.credit) || 0,
        creditLimit: Number(customer.creditLimit) || 0,
      });
    } else {
      setSelectedCustomer(null);
    }
    playBeep("click");
    onOpenChange(false);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newName.trim(),
          phone: newPhone.trim() || undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        handleSelect(created);
        setNewName("");
        setNewPhone("");
        setShowAddForm(false);
      }
    } catch {
      playBeep("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4 select-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span>
                {t("pos.customerModal.title", "Sélectionner un Client")}
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
            {t(
              "pos.customerModal.description",
              "Associez la vente à un client ou laissez en client comptoir anonyme",
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Action button: Default walk-in customer */}
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
            !selectedCustomer
              ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
              : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div className="text-start">
              <div className="font-bold text-sm text-foreground">
                {t(
                  "pos.customerModal.walkInTitle",
                  "Client Comptoir (Anonyme)",
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {t(
                  "pos.customerModal.walkInDesc",
                  "Vente au comptoir standard (espèces / carte)",
                )}
              </div>
            </div>
          </div>
          {!selectedCustomer && <Check className="h-5 w-5 text-primary" />}
        </button>

        {/* Search input and Quick Add toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                "pos.customerModal.searchPlaceholder",
                "Rechercher par nom ou téléphone...",
              )}
              className="w-full h-10 ps-9 pe-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-10 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center gap-1 border border-border transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t("pos.customerModal.newCustomer", "Nouveau")}</span>
          </button>
        </div>

        {/* Quick Add Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateCustomer}
            className="p-3 rounded-xl bg-card border border-border space-y-2.5 animate-in fade-in"
          >
            <div className="text-xs font-bold text-foreground">
              {t("pos.customerModal.quickAddTitle", "Ajout rapide de client")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={t("pos.customerModal.fullName", "Nom complet *")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <input
                type="text"
                placeholder={t("pos.customerModal.phone", "Téléphone")}
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors shadow-sm"
            >
              {t(
                "pos.customerModal.saveAndSelect",
                "Enregistrer et Sélectionner",
              )}
            </button>
          </form>
        )}

        {/* Customers list */}
        <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-border">
          {loading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              {t(
                "pos.customerModal.loadingCustomers",
                "Chargement des clients...",
              )}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              {t("pos.customerModal.noCustomers", "Aucun client trouvé.")}
            </div>
          ) : (
            customers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              const hasDebt = Number(c.credit) > 0;

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-primary/10 border border-primary text-primary"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      <span>{c.fullName}</span>
                      {hasDebt && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-mono border border-destructive/20">
                          {t("pos.customerModal.debtLabel", "Dette :")}{" "}
                          {formatCurrency(c.credit)}
                        </span>
                      )}
                    </div>
                    {c.phone && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </div>

                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Dialog>
  );
}
