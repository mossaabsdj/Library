"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePos } from "./posState";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency } from "@/lib/utils";
import { Zap, RefreshCw } from "lucide-react";
import { LogoLoader } from "@/components/ui/logo-loader";

export function PosQuickSale({
  onShowToast,
}: {
  onShowToast?: (message: string, type: "success" | "error") => void;
}) {
  const { addToCart } = usePos();
  const { t } = useI18n();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const loadQuickSaleProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/products?salesRapid=true&limit=48";
      if (selectedCategory !== "all") {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      // Failed to load quick sale products
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetch("/api/products/categories")
      .then((res) => res.json())
      .then((cats) => setCategories(cats || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadQuickSaleProducts();
  }, [loadQuickSaleProducts]);

  const handleCardClick = (product: any) => {
    const result = addToCart(product);
    if (!result.success) {
      onShowToast?.(result.message || t("pos.insufficientStock"), "error");
    } else {
      onShowToast?.(`${product.name} (+1)`, "success");
    }
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground rounded-2xl border border-border p-3 shadow-sm overflow-hidden select-none">
      {/* Category Pills Header */}
      <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto border-b border-border text-xs scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{t("pos.allCategories", "Tous")}</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}

        <button
          type="button"
          onClick={loadQuickSaleProducts}
          className="ms-auto p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title={t("pos.refresh", "Actualiser")}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Grid of Tactile Quick Sale Cards */}
      <div className="flex-1 overflow-y-auto pt-3 scrollbar-thin">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <LogoLoader size="sm" />
              <span className="text-xs">
                {t("common.loading", "Chargement...")}
              </span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Zap className="h-10 w-10 stroke-[1.2] text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">
              {t("common.empty", "Aucun produit en vente rapide.")}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
              {t(
                "pos.quickSaleHint",
                "Activez \"Sales_Rapid\" dans la fiche d'un produit pour l'afficher ici.",
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {products.map((p) => {
              const isLowStock = p.stockQuantity <= 5 && p.stockQuantity > 0;
              const isOutOfStock = p.stockQuantity <= 0;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleCardClick(p)}
                  className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-card hover:bg-muted/60 border border-border hover:border-primary/50 shadow-sm transition-all duration-150 active:scale-[0.97] text-start min-h-[92px]"
                >
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {p.name}
                      </span>
                      {p.reference && (
                        <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                          {p.reference}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full flex items-end justify-between mt-2 pt-2 border-t border-border">
                    <span className="font-black text-base text-primary font-mono tracking-tight">
                      {formatCurrency(p.unitPrice)}
                    </span>
                    <span className="text-[11px] font-medium">
                      {isOutOfStock ? (
                        <span className="text-destructive font-bold">
                          {t("product.outOfStock", "Rupture")}
                        </span>
                      ) : isLowStock ? (
                        <span className="text-amber-500 font-semibold">
                          {p.stockQuantity}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {p.stockQuantity}
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
