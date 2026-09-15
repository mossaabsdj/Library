"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/contexts/I18nContext";
import { useLoading } from "@/contexts/LoadingContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Truck,
  Package,
  AlertTriangle,
  XCircle,
  Users,
  Building2,
  RefreshCw,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {}
  };

  const loadMetrics = async (showSky = false) => {
    setLoading(true);
    if (showSky) {
      await withLoading(
        async () => {
          await fetchMetrics();
        },
        t(
          "dashboard.refreshSky",
          "Actualisation des indicateurs du tableau de bord...",
        ),
      );
      setLoading(false);
    } else {
      await fetchMetrics();
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics(false);
  }, []);

  return (
    <AppLayout title={t("dashboard.title", "Tableau de Bord & Indicateurs")}>
      <div className="space-y-6 select-none max-w-7xl">
        {/* Header with refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span>{t("dashboard.title", "Tableau de Bord Principal")}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "dashboard.subtitle",
                "Vue synthétique en temps réel de vos ventes, achats, marges et créances",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadMetrics(true)}
            className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/50 shadow-sm transition-all active:scale-95"
            title={t("pos.refresh", "Actualiser")}
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`}
            />
          </button>
        </div>

        {/* Top KPI Cards (Semantic Tokens + Theme-Aware) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Sales */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-500" />
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold">
                {t("dashboard.todaySales", "Ventes du Jour")}
              </span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-primary">
              {metrics ? formatCurrency(metrics.todaySales) : "..."}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              {metrics?.todaySalesCount || 0}{" "}
              {t("dashboard.todayTransactions", "transaction(s) aujourd'hui")}
            </div>
          </div>

          {/* Today's Purchases */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold">
                {t("dashboard.todayPurchases", "Achats du Jour")}
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-foreground">
              {metrics ? formatCurrency(metrics.todayPurchases) : "..."}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {t(
                "dashboard.supplierRestock",
                "Réapprovisionnement fournisseur",
              )}
            </div>
          </div>

          {/* Today's Profit */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold">
                {t("dashboard.todayProfit", "Bénéfice Estimé")}
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {metrics ? formatCurrency(metrics.todayProfit) : "..."}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {t(
                "dashboard.grossMarginDesc",
                "Marge brute (Prix Vente - Prix Achat)",
              )}
            </div>
          </div>

          {/* Total Products */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold">
                {t("dashboard.totalProducts", "Total Produits")}
              </span>
              <div className="p-2 rounded-xl bg-muted text-foreground">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-foreground">
              {metrics ? formatNumber(metrics.totalProducts) : "..."}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {t(
                "dashboard.catalogActiveRef",
                "Références actives en catalogue",
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-amber-500/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {t("dashboard.lowStockCount", "Stock Faible")}
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {metrics ? formatNumber(metrics.lowStockCount) : "..."}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
              {t("dashboard.lowStockDesc", "Stock ≤ 5 unités (à commander)")}
            </div>
          </div>

          {/* Out of Stock */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-destructive/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-destructive">
                {t("dashboard.outOfStockCount", "Ruptures de Stock")}
              </span>
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-destructive">
              {metrics ? formatNumber(metrics.outOfStockCount) : "..."}
            </div>
            <div className="text-[11px] text-destructive mt-1 font-semibold">
              {t("dashboard.outOfStockDesc", "Stock ≤ 0 (indisponible)")}
            </div>
          </div>

          {/* Customer Debt */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold">
                {t("dashboard.customerDebtTotal", "Dettes Clients (Crédits)")}
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {metrics ? formatCurrency(metrics.customerDebtTotal) : "..."}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {t("dashboard.customerDebtDesc", "Créances clients à encaisser")}
            </div>
          </div>

          {/* Supplier Debt */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold">
                {t("dashboard.supplierDebtTotal", "Dettes Fournisseurs")}
              </span>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">
              {metrics ? formatCurrency(metrics.supplierDebtTotal) : "..."}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {t("dashboard.supplierDebtDesc", "Restes dus aux fournisseurs")}
            </div>
          </div>
        </div>

        {/* Charts Section: Sales Trend + Top Selling Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend (7 Days) */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>
                  {t(
                    "dashboard.salesTrend",
                    "Évolution des Ventes (7 Derniers Jours)",
                  )}
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              {metrics?.salesTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.salesTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-border"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="day"
                      stroke="currentColor"
                      className="text-muted-foreground"
                      fontSize={11}
                    />
                    <YAxis
                      stroke="currentColor"
                      className="text-muted-foreground"
                      fontSize={11}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "0.75rem",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                        color: "var(--foreground)",
                      }}
                      formatter={(val: any) => [
                        `${formatCurrency(val)}`,
                        t("dashboard.chartSalesTooltip", "Ventes"),
                      ]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="var(--primary)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  {t("dashboard.chartLoading", "Chargement du graphique...")}
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-3">
            <div className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Award className="h-4 w-4 text-amber-500" />
              <span>{t("dashboard.topProducts", "Top Produits Vendus")}</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {metrics?.topProducts && metrics.topProducts.length > 0 ? (
                metrics.topProducts.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-muted/50 border border-border flex items-center justify-between transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono flex-shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-foreground truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {p.category ||
                            t("dashboard.generalCategory", "Général")}
                        </div>
                      </div>
                    </div>

                    <div className="text-end flex-shrink-0 ps-2">
                      <div className="font-mono font-bold text-xs text-primary">
                        {p.quantity} {t("dashboard.unitsSold", "vendus")}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {formatCurrency(p.total)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {t(
                    "dashboard.noRecentSales",
                    "Aucune vente enregistrée récemment.",
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
