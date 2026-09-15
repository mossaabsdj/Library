"use client";

import React, { useState, useEffect } from "react";
import { usePos } from "./posState";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency, getProductImageUrl } from "@/lib/utils";
import { Image as ImageIcon, Search, LayoutGrid } from "lucide-react";
import { LogoLoader } from "@/components/ui/logo-loader";

export function PosVisualCatalog({
  onShowToast,
}: {
  onShowToast?: (msg: string, type: "success" | "error") => void;
}) {
  const { addToCart } = usePos();
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/products/categories");
        if (res.ok) {
          const cats = await res.json();
          setCategories(cats || []);
        }
      } catch {}
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `/api/products?limit=80`;
        if (selectedCategory !== "all")
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        if (filterText.trim())
          url += `&search=${encodeURIComponent(filterText.trim())}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        // failed
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchProducts, 150);
    const handleCreated = () => fetchProducts();
    window.addEventListener("product-created", handleCreated);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("product-created", handleCreated);
    };
  }, [selectedCategory, filterText]);

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
      {/* Search & Category Filter Header */}
      <div className="space-y-2 pb-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t("pos.filterCatalog", "Filtrer le catalogue...")}
              className="w-full h-9 ps-9 pe-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {t("pos.allCategories", "Toutes")}
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
        </div>
      </div>

      {/* Visual Product Grid */}
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
            <LayoutGrid className="h-10 w-10 stroke-[1.2] text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">
              {t("common.empty", "Aucun produit trouvé.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {products.map((p) => {
              const isLowStock = p.stockQuantity <= 5 && p.stockQuantity > 0;
              const isOutOfStock = p.stockQuantity <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => handleCardClick(p)}
                  className="group relative flex flex-col rounded-xl bg-card hover:bg-muted/60 border border-border hover:border-primary/50 shadow-sm transition-all duration-150 active:scale-[0.97] cursor-pointer overflow-hidden"
                >
                  {/* Product Image Area */}
                  <div className="h-24 w-full bg-muted flex items-center justify-center relative overflow-hidden">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getProductImageUrl(p.image)}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground/40 group-hover:text-primary transition-colors">
                        <ImageIcon className="h-8 w-8 stroke-[1.2]" />
                      </div>
                    )}

                    {/* Stock badge overlay */}
                    <div className="absolute top-1.5 end-1.5">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
                          {t("product.outOfStock", "Rupture")}
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          {p.stockQuantity}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                          {p.stockQuantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details Area */}
                  <div className="p-2.5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="font-bold text-xs text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {p.name}
                      </div>
                      {p.reference && (
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {p.reference}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-border flex items-baseline justify-between">
                      <span className="font-black text-sm text-primary font-mono">
                        {formatCurrency(p.unitPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
