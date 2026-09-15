"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ProductModal } from "@/features/products/ProductModal";
import { useI18n } from "@/contexts/I18nContext";
import { useLoading } from "@/contexts/LoadingContext";
import { formatCurrency, playBeep } from "@/lib/utils";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Zap,
  Download,
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

export default function ProductsPage() {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockStatus, setStockStatus] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/products/categories");
      if (res.ok) {
        const cats = await res.json();
        setCategories(cats || []);
      }
    } catch {}
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/products?page=${page}&limit=25`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (selectedCategory !== "all")
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (stockStatus !== "all") url += `&stockStatus=${stockStatus}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // Failed to load products
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, stockStatus]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 200);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  // Listen to global product created event from header button
  useEffect(() => {
    const handleCreated = () => {
      loadProducts();
      fetchCategories();
    };
    window.addEventListener("product-created", handleCreated);
    return () => window.removeEventListener("product-created", handleCreated);
  }, [loadProducts]);

  const handleEdit = (id: number) => {
    setSelectedProductId(id);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProductId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Confirmer la suppression définitive du produit "${name}" ?`))
      return;

    try {
      await withLoading(async () => {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
          playBeep("click");
          await loadProducts();
        } else {
          const err = await res.json();
          alert(err.error || "Erreur de suppression");
        }
      }, "Suppression du produit...");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AppLayout
      title={t("product.title", "Gestion des Produits & Codes-barres")}
    >
      <div className="space-y-4 select-none">
        {/* Top Header Bar with Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span>{t("product.title", "Catalogue Produits")}</span>
              <Badge
                variant="secondary"
                className="font-mono bg-primary/10 text-primary border-primary/20"
              >
                {total} {t("product.title", "produits")}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestion de la nomenclature, codes-barres multiples, prix et seuils
              de stock
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/export/products?format=csv"
              className="h-10 px-3.5 rounded-xl bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-2 border border-border shadow-sm transition-colors"
              title="Exporter au format CSV d'origine"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">Export CSV</span>
            </a>

            <button
              type="button"
              onClick={handleCreate}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/25 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>{t("product.addProduct", "+ Nouveau Produit")}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 rounded-2xl bg-card border border-border shadow-sm flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t(
                "common.search",
                "Rechercher par nom, code-barre, référence...",
              )}
              className="w-full h-9 ps-9 pe-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("product.category", "Catégorie")} :
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">
                {t("pos.allCategories", "Toutes Catégories")}
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("product.stockStatus", "Stock")} :
            </span>
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">{t("common.all", "Tous les stocks")}</option>
              <option value="inStock">
                {t("product.inStock", "En Stock (> 5)")}
              </option>
              <option value="lowStock">
                {t("product.lowStock", "Stock Faible (≤ 5)")}
              </option>
              <option value="outOfStock">
                {t("product.outOfStock", "Rupture de Stock (≤ 0)")}
              </option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border">
                <TableHead className="w-16 font-mono text-muted-foreground">
                  ID
                </TableHead>
                <TableHead className="text-foreground">
                  {t("product.nom", "Désignation (Nom)")}
                </TableHead>
                <TableHead className="font-mono text-muted-foreground">
                  {t("product.codeBarre", "Code_Barre")}
                </TableHead>
                <TableHead className="font-mono text-muted-foreground">
                  {t("product.refference", "Référence")}
                </TableHead>
                <TableHead className="text-foreground">
                  {t("product.categorie", "Catégorie")}
                </TableHead>
                <TableHead className="text-end text-foreground">
                  {t("product.prixUnit", "Prix_Unit")}
                </TableHead>
                <TableHead className="text-end text-foreground">
                  {t("product.prixAchat", "Prix_Achat")}
                </TableHead>
                <TableHead className="text-end text-foreground">
                  {t("product.stockQ", "Stock_Q")}
                </TableHead>
                <TableHead className="text-center text-foreground">
                  {t("product.salesRapid", "Rapide")}
                </TableHead>
                <TableHead className="text-end text-foreground">
                  {t("common.actions", "Actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingState
                  columns={10}
                  text={t(
                    "product.modal.loadingProduct",
                    "Chargement du catalogue...",
                  )}
                />
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-12 text-muted-foreground"
                  >
                    {t(
                      "common.empty",
                      "Aucun produit ne correspond à ces critères.",
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  const isLowStock =
                    p.stockQuantity <= 5 && p.stockQuantity > 0;
                  const uP = Number(p.unitPrice);
                  const pP =
                    p.purchasePrice !== null ? Number(p.purchasePrice) : null;
                  const barcodesCount =
                    p.barcodes?.length || (p.primaryBarcode ? 1 : 0);

                  return (
                    <TableRow
                      key={p.id}
                      className="border-border hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-mono text-muted-foreground font-bold">
                        {p.id}
                      </TableCell>

                      <TableCell className="font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {barcodesCount > 1 && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono border border-primary/20">
                              +{barcodesCount - 1} bc
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {p.primaryBarcode || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.reference || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {p.category || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-end font-mono font-bold text-primary">
                        {formatCurrency(uP)}
                      </TableCell>

                      <TableCell className="text-end font-mono text-xs text-muted-foreground">
                        {pP !== null ? formatCurrency(pP) : "—"}
                      </TableCell>

                      <TableCell className="text-end font-mono font-bold">
                        {isOutOfStock ? (
                          <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-2 py-0.5 rounded-full text-xs">
                            0 ({t("product.outOfStock", "Rupture")})
                          </span>
                        ) : isLowStock ? (
                          <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded-full text-xs">
                            {p.stockQuantity} ({t("product.lowStock", "Faible")}
                            )
                          </span>
                        ) : (
                          <span className="text-foreground">
                            {p.stockQuantity}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        {p.salesRapid ? (
                          <span
                            className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-primary/10 text-primary border border-primary/20"
                            title="Vente Rapide active"
                          >
                            <Zap className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(p.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                            title={t(
                              "product.editProduct",
                              "Modifier la fiche produit",
                            )}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-muted transition-colors"
                            title={t("common.delete", "Supprimer")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="p-3 border-t border-border bg-muted/40 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {products.length} / {total} {t("product.title", "produits")} •
              Page {page} / {totalPages}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg bg-card border border-border text-foreground disabled:opacity-30 hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-mono font-bold text-foreground">
                {page}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="p-1.5 rounded-lg bg-card border border-border text-foreground disabled:opacity-30 hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Edit / Create Modal */}
      <ProductModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        productId={selectedProductId}
        onSuccess={loadProducts}
      />
    </AppLayout>
  );
}
