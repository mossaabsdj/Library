"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePos } from "./posState";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency, playBeep } from "@/lib/utils";
import { LogoLoader } from "@/components/ui/logo-loader";
import {
  Search,
  Barcode,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function PosSearch() {
  const { addToCart } = usePos();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global keydown listeners for F1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear feedback message after 3 seconds
  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  // Debounced search for suggestions when user is typing text
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(trimmed)}&limit=8`,
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.products || []);
          setSelectedIndex(-1);
        }
      } catch {
        // search fetch failed
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle direct barcode scanning or item addition
  const handleBarcodeOrDirectAdd = async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      // 1. Try finding by barcode directly
      const barcodeRes = await fetch(
        `/api/products/barcode/${encodeURIComponent(trimmed)}`,
      );
      if (barcodeRes.ok) {
        const product = await barcodeRes.json();
        const result = addToCart(product, trimmed);
        if (result.success) {
          setStatusMessage({ text: `${product.name} (+1)`, type: "success" });
        } else {
          setStatusMessage({
            text: result.message || t("pos.insufficientStock"),
            type: "error",
          });
        }
        setQuery("");
        setSuggestions([]);
        inputRef.current?.focus();
        return;
      }

      // 2. If not found by barcode and there are active dropdown suggestions, add the highlighted or first one
      if (suggestions.length > 0) {
        const chosen =
          selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
        if (chosen) {
          selectSuggestion(chosen);
          return;
        }
      }

      // 3. Fallback: search by name or reference match
      const searchRes = await fetch(
        `/api/products?search=${encodeURIComponent(trimmed)}&limit=1`,
      );
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          const result = addToCart(product);
          if (result.success) {
            setStatusMessage({ text: `${product.name} (+1)`, type: "success" });
          } else {
            setStatusMessage({
              text: result.message || t("pos.insufficientStock"),
              type: "error",
            });
          }
          setQuery("");
          setSuggestions([]);
          inputRef.current?.focus();
          return;
        }
      }

      // Product Not Found Alert
      playBeep("error");
      setStatusMessage({
        text: `${t("pos.searchNotFound", "Aucun produit trouvé pour")} "${trimmed}"`,
        type: "error",
      });
      setQuery("");
      inputRef.current?.focus();
    } catch {
      playBeep("error");
      setStatusMessage({
        text: t("pos.searchError", "Erreur lors de la recherche"),
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation within suggestions
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && selectedIndex >= 0) {
        selectSuggestion(suggestions[selectedIndex]);
      } else {
        handleBarcodeOrDirectAdd(query);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  const selectSuggestion = (product: any) => {
    const result = addToCart(product);
    if (result.success) {
      setStatusMessage({ text: `${product.name} (+1)`, type: "success" });
    } else {
      setStatusMessage({
        text: result.message || t("pos.insufficientStock"),
        type: "error",
      });
    }
    setQuery("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      {/* Persistent Barcode & Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-primary">
          <Barcode className="h-6 w-6" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t(
            "pos.searchPlaceholder",
            "Scanner code-barre (Auto) ou rechercher nom / référence... [F1]",
          )}
          className="w-full h-14 ps-14 pe-28 rounded-2xl bg-card border-2 border-primary/30 text-foreground placeholder:text-muted-foreground text-base md:text-lg font-medium shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all"
          autoComplete="off"
          autoFocus
        />
        <div className="absolute inset-y-0 end-0 flex items-center pe-3 gap-2">
          {isLoading && <LogoLoader size="sm" />}
          <kbd className="hidden sm:inline-block px-2.5 py-1 text-xs font-mono font-bold bg-primary/10 text-primary rounded-lg border border-primary/20 shadow-sm">
            F1
          </kbd>
        </div>
      </div>

      {/* Floating Status Notification */}
      {statusMessage && (
        <div
          className={`absolute z-30 start-2 top-16 mt-1 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === "success"
              ? "bg-primary text-primary-foreground"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Auto-suggest dropdown */}
      {suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-40 start-0 end-0 top-16 mt-2 rounded-2xl border border-border bg-card/95 text-card-foreground shadow-2xl backdrop-blur-md overflow-hidden max-h-96 overflow-y-auto"
        >
          <div className="p-2 divide-y divide-border">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isLowStock =
                item.stockQuantity <= 5 && item.stockQuantity > 0;
              const isOutOfStock = item.stockQuantity <= 0;

              return (
                <div
                  key={item.id}
                  onClick={() => selectSuggestion(item)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-bold border border-primary/30"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate">
                        {item.name}
                      </span>
                      {item.reference && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                          {item.reference}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                      {item.primaryBarcode && (
                        <span className="font-mono text-primary font-bold">
                          {item.primaryBarcode}
                        </span>
                      )}
                      {item.category && <span>• {item.category}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-end">
                    <div>
                      <div className="font-extrabold text-base text-primary font-mono">
                        {formatCurrency(item.unitPrice)}
                      </div>
                      <div className="text-xs">
                        {isOutOfStock ? (
                          <span className="text-destructive font-semibold">
                            {t("product.outOfStock", "Rupture")} (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="text-amber-500 font-semibold">
                            {t("product.lowStock", "Stock:")}{" "}
                            {item.stockQuantity}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {t("product.stockQ", "Stock:")} {item.stockQuantity}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight
                      className={`h-4 w-4 text-muted-foreground ${
                        isSelected ? "text-primary translate-x-1" : ""
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
