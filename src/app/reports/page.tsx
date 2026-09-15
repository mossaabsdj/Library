"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/contexts/I18nContext";
import { useLoading } from "@/contexts/LoadingContext";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Package,
  ArrowDownRight,
  DollarSign,
  RefreshCw,
} from "lucide-react";

export default function ReportsPage() {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">(
    "month",
  );
  const [financial, setFinancial] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinancial = async (selectedPeriod: typeof period) => {
    let startDate: string | undefined;
    const now = new Date();

    if (selectedPeriod === "today") {
      now.setHours(0, 0, 0, 0);
      startDate = now.toISOString();
    } else if (selectedPeriod === "week") {
      now.setDate(now.getDate() - 7);
      startDate = now.toISOString();
    } else if (selectedPeriod === "month") {
      now.setDate(now.getDate() - 30);
      startDate = now.toISOString();
    }

    let url = "/api/reports/financial";
    if (startDate) url += `?startDate=${encodeURIComponent(startDate)}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setFinancial(data);
    }
  };

  const loadReport = async (p = period, showSky = false) => {
    setLoading(true);
    if (showSky) {
      await withLoading(
        async () => {
          await fetchFinancial(p);
        },
        t("reports.generating", "Génération du rapport financier..."),
      );
    } else {
      await fetchFinancial(p);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReport(period, false);
  }, [period]);

  return (
    <AppLayout title={t("reports.title", "Rapports & États Financiers")}>
      <div className="space-y-6 select-none max-w-6xl">
        {/* Header with Period Selectors */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span>
                {t("reports.title", "Rapport Financier & Valorisation")}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "reports.subtitle",
                "Chiffre d'affaires, marge brute, charges d'exploitation et bénéfice net",
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-card rounded-2xl border border-border shadow-sm text-xs">
              {(
                [
                  { id: "today", label: t("reports.today", "Aujourd'hui") },
                  { id: "week", label: t("reports.thisWeek", "7 Jours") },
                  { id: "month", label: t("reports.thisMonth", "30 Jours") },
                  { id: "all", label: t("common.all", "Global") },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    period === p.id
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => loadReport(period, true)}
              className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-primary shadow-sm transition-all"
              title={t("pos.refresh", "Actualiser")}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* P&L Statement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Revenue */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold">
                {t("reports.totalRevenue", "Chiffre d'Affaires (Ventes)")}
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
              {financial ? formatCurrency(financial.totalRevenue) : "..."}
            </div>
            <div className="text-xs text-muted-foreground">
              {financial?.salesCount || 0}{" "}
              {t("reports.salesRealized", "vente(s) réalisée(s)")}
            </div>
          </div>

          {/* Cost of Goods Sold (COGS) */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold">
                {t("reports.totalCost", "Coût d'Achat Marchandises (COGS)")}
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-foreground">
              {financial ? formatCurrency(financial.totalCogs) : "..."}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("reports.cogsDesc", "Prix de revient des articles vendus")}
            </div>
          </div>

          {/* Gross Profit */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold">
                {t("reports.grossProfit", "Bénéfice Brut Commercial")}
              </span>
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400">
              {financial ? formatCurrency(financial.grossProfit) : "..."}
            </div>
            <div className="text-xs text-muted-foreground">
              {t(
                "reports.grossProfitDesc",
                "Marge brute avant déduction des charges",
              )}
            </div>
          </div>

          {/* Total Expenses */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold">
                {t("reports.totalExpenses", "Charges & Dépenses")}
              </span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              {financial ? formatCurrency(financial.totalExpenses) : "..."}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("reports.expensesDesc", "Loyer, salaires, énergie, entretien")}
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-500/10 via-card to-card border border-emerald-500/30 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
              <span className="font-bold">
                {t("reports.netProfit", "Bénéfice Net Réel")}
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {financial ? formatCurrency(financial.netProfit) : "..."}
            </div>
            <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium">
              {t(
                "reports.netProfitDesc",
                "Résultat net d'exploitation après déduction de toutes charges",
              )}
            </div>
          </div>

          {/* Inventory Valuation */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold">
                {t("reports.stockValue", "Valeur Totale du Stock (Achat)")}
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
              {financial ? formatCurrency(financial.stockCostValue) : "..."}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {t("reports.stockRetailValue", "Valeur vente estimée :")}{" "}
              {financial ? formatCurrency(financial.stockRetailValue) : "..."}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
