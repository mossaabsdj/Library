"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency, playBeep } from "@/lib/utils";
import {
  ReceiptText,
  Search,
  RotateCw,
  ShoppingCart,
  Eye,
  Printer,
  Edit2,
  Calendar,
  Filter,
  DollarSign,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
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
import Link from "next/link";
import { SaleDetailsModal } from "@/features/sales/SaleDetailsModal";
import { SaleUpdateModal } from "@/features/sales/SaleUpdateModal";
import { ReceiptModal } from "@/features/pos/ReceiptModal";

export default function SalesPage() {
  const { t, locale } = useI18n();

  const [sales, setSales] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Aggregates for KPIs
  const [aggregates, setAggregates] = useState({
    totalRevenue: 0,
    totalPaid: 0,
    totalRemaining: 0,
    totalCount: 0,
  });

  // Filter States
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [customerId, setCustomerId] = useState("");
  const [datePreset, setDatePreset] = useState<
    "all" | "today" | "yesterday" | "thisMonth" | "custom"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Customers for filter dropdown
  const [customers, setCustomers] = useState<any[]>([]);

  // Modals state
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<
    any | null
  >(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<any | null>(
    null,
  );
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<
    any | null
  >(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Load Customers
  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data || []))
      .catch(() => {});
  }, []);

  // Set date presets
  const applyDatePreset = (
    preset: "all" | "today" | "yesterday" | "thisMonth",
  ) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = now.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().slice(0, 10);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const todayStr = now.toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(todayStr);
    }
    setPage(1);
  };

  // Load Sales Data
  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "25");

      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      if (paymentMethod !== "ALL") params.set("paymentMethod", paymentMethod);
      if (customerId) params.set("customerId", customerId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.aggregates) {
          setAggregates(data.aggregates);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sales:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, paymentMethod, customerId, startDate, endDate]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPaymentMethod("ALL");
    setCustomerId("");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Action handlers
  const handleViewDetails = (sale: any) => {
    setSelectedSaleForDetails(sale);
    setDetailsModalOpen(true);
  };

  const handlePrintReceipt = (sale: any) => {
    setSelectedSaleForReceipt(sale);
    setReceiptModalOpen(true);
  };

  const handleEditSale = (sale: any) => {
    setSelectedSaleForEdit(sale);
    setEditModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                {t("sales.title", "Gestion des Ventes & Factures")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t(
                  "sales.subtitle",
                  "Consultez, filtrez, réimprimez et gérez l'ensemble des tickets et ventes du magasin",
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadSales()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-muted text-foreground text-xs font-bold border border-border transition-colors shadow-sm"
              title="Rafraîchir les données"
            >
              <RotateCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>{t("common.refresh", "Actualiser")}</span>
            </button>

            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 transition-all active:scale-95"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>{t("header.quickSale", "Vente Comptoir (POS)")}</span>
            </Link>
          </div>
        </div>

        {/* 4 Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Transactions */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("sales.kpi.totalSales", "Total Ventes")}
              </span>
              <div className="text-2xl font-black text-foreground font-mono">
                {aggregates.totalCount}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ReceiptText className="h-5 w-5" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("sales.kpi.revenue", "Chiffre d'Affaires")}
              </span>
              <div className="text-2xl font-black text-foreground font-mono">
                {formatCurrency(aggregates.totalRevenue)}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          {/* Total Collected */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("sales.kpi.collected", "Montant Encaissé")}
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(aggregates.totalPaid)}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          {/* Total Remaining / Credit */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("sales.kpi.credit", "Crédit Client (Reste)")}
              </span>
              <div
                className={`text-2xl font-black font-mono ${
                  aggregates.totalRemaining > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {formatCurrency(aggregates.totalRemaining)}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3.5">
          {/* Row 1: Search & Date Presets */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t(
                  "sales.filters.searchPlaceholder",
                  "Rechercher par N° ticket, client, caissier, note...",
                )}
                className="w-full h-10 ps-9 pe-4 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyDatePreset("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  datePreset === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("sales.filters.allTime", "Tout")}
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset("today")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  datePreset === "today"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("sales.filters.today", "Aujourd'hui")}
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset("yesterday")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  datePreset === "yesterday"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("sales.filters.yesterday", "Hier")}
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset("thisMonth")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  datePreset === "thisMonth"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("sales.filters.thisMonth", "Ce mois")}
              </button>
            </div>
          </div>

          {/* Row 2: Multi-Criteria Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 border-t border-border">
            {/* Status Select */}
            <div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">
                  {t("sales.filters.allStatus", "Tous les statuts")}
                </option>
                <option value="COMPLETED">
                  {t("sales.filters.completed", "Complété")}
                </option>
                <option value="RETURNED">
                  {t("sales.filters.returned", "Retourné")}
                </option>
                <option value="HELD">
                  {t("sales.filters.held", "En attente")}
                </option>
              </select>
            </div>

            {/* Payment Method Select */}
            <div>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">
                  {t("sales.filters.allPaymentMethods", "Tous les modes")}
                </option>
                <option value="CASH">
                  {t("sales.filters.cash", "Espèces")}
                </option>
                <option value="CARD">{t("sales.filters.card", "Carte")}</option>
                <option value="CREDIT">
                  {t("sales.filters.creditPay", "À Crédit")}
                </option>
              </select>
            </div>

            {/* Customer Filter */}
            <div>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">
                  {t("sales.filters.allCustomers", "Tous les clients")}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                  setPage(1);
                }}
                className="w-full h-9 px-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                  setPage(1);
                }}
                className="w-full h-9 px-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Reset Button */}
            <div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full h-9 px-3 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-muted-foreground hover:text-foreground border border-border transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                <span>{t("sales.filters.reset", "Réinitialiser")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sales Table Card */}
        <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">
                    {t("sales.table.dateTime", "Date & Heure")}
                  </TableHead>
                  <TableHead className="font-bold font-mono">
                    {t("sales.table.invoice", "N° Ticket / Facture")}
                  </TableHead>
                  <TableHead className="font-bold">
                    {t("sales.table.customer", "Client")}
                  </TableHead>
                  <TableHead className="text-center font-bold">
                    {t("sales.table.items", "Articles")}
                  </TableHead>
                  <TableHead className="font-bold">
                    {t("sales.table.method", "Mode")}
                  </TableHead>
                  <TableHead className="text-end font-bold">
                    {t("sales.table.total", "Total")}
                  </TableHead>
                  <TableHead className="text-end font-bold">
                    {t("sales.table.paid", "Payé")}
                  </TableHead>
                  <TableHead className="text-end font-bold">
                    {t("sales.table.remaining", "Reste (Crédit)")}
                  </TableHead>
                  <TableHead className="text-center font-bold">
                    {t("sales.table.status", "Statut")}
                  </TableHead>
                  <TableHead className="text-end font-bold">
                    {t("sales.table.actions", "Actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableLoadingState columns={10} />
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="py-14 text-center text-muted-foreground text-xs"
                    >
                      <ReceiptText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="font-bold">
                        {t("sales.table.noSales", "Aucune vente trouvée.")}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => {
                    const remaining = Number(sale.remainingAmount || 0);
                    const isReturned = sale.status === "RETURNED";
                    const isHeld = sale.status === "HELD";

                    return (
                      <TableRow
                        key={sale.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        {/* Date & Time */}
                        <TableCell className="font-semibold text-xs text-foreground whitespace-nowrap">
                          {new Date(
                            sale.date || sale.createdAt,
                          ).toLocaleDateString(
                            locale === "ar"
                              ? "ar-DZ"
                              : locale === "en"
                                ? "en-US"
                                : "fr-FR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </TableCell>

                        {/* Invoice Number */}
                        <TableCell className="font-mono font-bold text-xs text-primary whitespace-nowrap">
                          {sale.invoiceNumber}
                        </TableCell>

                        {/* Customer */}
                        <TableCell className="text-xs">
                          {sale.customer ? (
                            <span className="font-bold text-foreground">
                              {sale.customer.fullName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              {t(
                                "sales.table.walkInCustomer",
                                "Client Comptoir",
                              )}
                            </span>
                          )}
                        </TableCell>

                        {/* Items Count */}
                        <TableCell className="text-center font-mono text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-muted font-semibold">
                            {sale.items?.length || 0}
                          </span>
                        </TableCell>

                        {/* Payment Method */}
                        <TableCell className="text-xs whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] font-bold"
                          >
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell className="text-end font-mono font-black text-xs text-foreground whitespace-nowrap">
                          {formatCurrency(sale.finalAmount)}
                        </TableCell>

                        {/* Paid Amount */}
                        <TableCell className="text-end font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(sale.paidAmount)}
                        </TableCell>

                        {/* Remaining Amount (Credit) */}
                        <TableCell className="text-end font-mono font-bold text-xs whitespace-nowrap">
                          {remaining > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {formatCurrency(remaining)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center whitespace-nowrap">
                          {isReturned ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px] font-bold"
                            >
                              {t("sales.filters.returned", "Retourné")}
                            </Badge>
                          ) : isHeld ? (
                            <Badge
                              variant="warning"
                              className="text-[10px] font-bold"
                            >
                              {t("sales.filters.held", "En attente")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="success"
                              className="text-[10px] font-bold"
                            >
                              {t("sales.filters.completed", "Complété")}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => handleViewDetails(sale)}
                              title={t(
                                "sales.table.viewDetails",
                                "Voir les détails",
                              )}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Reprint Receipt */}
                            <button
                              type="button"
                              onClick={() => handlePrintReceipt(sale)}
                              title={t(
                                "sales.table.printReceipt",
                                "Réimprimer le ticket",
                              )}
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                            >
                              <Printer className="h-4 w-4" />
                            </button>

                            {/* Edit Sale */}
                            <button
                              type="button"
                              onClick={() => handleEditSale(sale)}
                              title={t(
                                "sales.table.editSale",
                                "Modifier la vente",
                              )}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              {t("sales.table.showing", "Affichage de")}{" "}
              <strong className="text-foreground">{sales.length}</strong> sur{" "}
              <strong className="text-foreground">{total}</strong>{" "}
              {t("sales.kpi.totalSales", "ventes")}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                <span>{t("common.previous", "Précédent")}</span>
              </button>

              <span className="font-mono px-2 font-bold text-foreground">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                <span>{t("common.next", "Suivant")}</span>
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Details Modal */}
      {selectedSaleForDetails && (
        <SaleDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          sale={selectedSaleForDetails}
          onPrint={(saleToPrint) => {
            setDetailsModalOpen(false);
            handlePrintReceipt(saleToPrint);
          }}
          onEdit={(saleToEdit) => {
            setDetailsModalOpen(false);
            handleEditSale(saleToEdit);
          }}
        />
      )}

      {/* Sale Update Modal */}
      {selectedSaleForEdit && (
        <SaleUpdateModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          sale={selectedSaleForEdit}
          onSuccess={() => {
            playBeep("success");
            loadSales();
          }}
        />
      )}

      {/* Printable Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          open={receiptModalOpen}
          onOpenChange={setReceiptModalOpen}
          sale={selectedSaleForReceipt}
        />
      )}
    </AppLayout>
  );
}
