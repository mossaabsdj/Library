"use client";

import React, { useState } from "react";
import React, { useState, useEffect, useRef } from "react";
import { usePos } from "./posState";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency } from "@/lib/utils";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  UserCheck,
  UserPlus,
  CreditCard,
  PauseCircle,
  FolderOpen,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function PosCart({
  onOpenPayment,
  onOpenCustomerSelect,
  onOpenHoldModal,
  onOpenHeldSalesList,
}: {
  onOpenPayment: () => void;
  onOpenCustomerSelect: () => void;
  onOpenHoldModal: () => void;
  onOpenHeldSalesList: () => void;
}) {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    selectedCustomer,
    subtotal,
    totalDue,
    globalDiscount,
    setGlobalDiscount,
    totalItemsCount,
    heldSales,
    activeTicketId,
  } = usePos();
  const { t } = useI18n();

  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountVal, setDiscountVal] = useState(String(globalDiscount));

  const cartListRef = useRef<HTMLDivElement>(null);
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const prevItemsCountRef = useRef(totalItemsCount);
  const prevTicketIdRef = useRef(activeTicketId);

  // Automatically scroll down in the receipt/cart when a new product is added
  useEffect(() => {
    // If user switched active ticket tab, sync without auto-scrolling
    if (prevTicketIdRef.current !== activeTicketId) {
      prevTicketIdRef.current = activeTicketId;
      prevItemsCountRef.current = totalItemsCount;
      return;
    }

    if (totalItemsCount > prevItemsCountRef.current) {
      // Small timeout ensures DOM elements have rendered before scrolling
      const timer = setTimeout(() => {
        if (cartListRef.current) {
          cartListRef.current.scrollTo({
            top: cartListRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
        itemsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);

      return () => clearTimeout(timer);
    }
    prevItemsCountRef.current = totalItemsCount;
  }, [totalItemsCount, activeTicketId]);

  const handleApplyDiscount = () => {
    const num = parseFloat(discountVal) || 0;
    setGlobalDiscount(num);
    setEditingDiscount(false);
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden select-none">
      {/* Cart Header with Customer Badge */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              {t("pos.cart", "Panier")}
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold">
                {totalItemsCount} {t("pos.itemsCount", "art.")}
              </span>
            </h2>
          </div>
        </div>

        {/* Customer Selector Button */}
        <button
          onClick={onOpenCustomerSelect}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            selectedCustomer
              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15"
              : "bg-background text-foreground border-input hover:bg-muted"
          }`}
          title={`${t("pos.customerModal.title", "Sélectionner ou changer le client")} [F2]`}
        >
          {selectedCustomer ? (
            <>
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <span className="max-w-[120px] truncate">
                {selectedCustomer.fullName}
              </span>
              {selectedCustomer.credit > 0 && (
                <span className="text-[10px] bg-destructive/15 text-destructive px-1 rounded border border-destructive/30 font-mono">
                  {t("pos.customerModal.debtLabel", "Dette :")}{" "}
                  {formatCurrency(selectedCustomer.credit)}
                </span>
              )}
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t("pos.noCustomer", "Client Comptoir")}</span>
            </>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            F2
          </span>
        </button>
      </div>

      {/* Cart Line Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 bg-background/50">
      <div
        ref={cartListRef}
        className="flex-1 overflow-y-auto p-2.5 space-y-1.5 bg-background/50 scroll-smooth"
      >
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 stroke-[1.2] mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground max-w-[220px]">
              {t(
                "pos.cartEmpty",
                "Le panier est vide. Scannez un code-barre ou choisissez un produit.",
              )}
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/60 border border-border shadow-sm transition-all group"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0 pe-2">
                <div className="font-bold text-sm text-foreground truncate">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 font-mono">
                  <span>{formatCurrency(item.unitPrice)}</span>
                  {item.barcode && (
                    <span className="text-muted-foreground/70">
                      • {item.barcode}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  className="h-7 w-7 rounded-lg bg-card hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors shadow-sm active:scale-95"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(
                      item.productId,
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className="w-10 text-center bg-transparent font-bold text-sm text-foreground focus:outline-none font-mono"
                />

                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                  className="h-7 w-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-colors shadow-sm active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Line Subtotal */}
              <div className="w-24 text-end font-black text-sm text-primary font-mono ps-2">
                {formatCurrency(item.subtotal)}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFromCart(item.productId)}
                className="p-1.5 ms-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-80 group-hover:opacity-100"
                title={t("common.delete", "Supprimer")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
        <div ref={itemsEndRef} />
      </div>

      {/* Cart Summary & Actions Footer */}
      <div className="p-4 border-t border-border bg-card space-y-3">
        {/* Subtotal and Discount */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{t("pos.subtotal", "Sous-total")}</span>
            <span className="font-mono font-bold text-foreground">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setEditingDiscount(!editingDiscount)}
              className="flex items-center gap-1 text-primary font-semibold hover:underline"
            >
              <Tag className="h-3 w-3" />
              <span>{t("pos.discount", "Remise [F6]")}</span>
            </button>
            {editingDiscount ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={discountVal}
                  onChange={(e) => setDiscountVal(e.target.value)}
                  className="w-16 h-6 px-1 text-end bg-background border border-input rounded text-xs text-foreground"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px]"
                  onClick={handleApplyDiscount}
                >
                  OK
                </Button>
              </div>
            ) : (
              <span className="font-mono font-bold text-destructive">
                -{formatCurrency(globalDiscount)}
              </span>
            )}
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-baseline pt-2 border-t border-border">
            <span className="text-sm font-bold text-foreground uppercase tracking-wider">
              {t("pos.total", "Total à Payer")}
            </span>
            <span className="text-3xl font-black text-primary font-mono tracking-tight">
              {formatCurrency(totalDue)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Pay Button F3 */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onOpenPayment}
            className="col-span-2 h-14 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none text-primary-foreground font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
          >
            <CreditCard className="h-6 w-6" />
            <span>{t("pos.payButton", "Payer")}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-black/20 font-mono">
              F3
            </span>
          </button>

          {/* Hold Current Sale F8 */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onOpenHoldModal}
            className="h-10 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <PauseCircle className="h-4 w-4" />
            <span>{t("pos.holdSale", "Attente")}</span>
            <span className="text-[10px] font-mono opacity-80">F8</span>
          </button>

          {/* View Suspended Sales F9 */}
          <button
            type="button"
            onClick={onOpenHeldSalesList}
            className="h-10 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors relative"
          >
            <FolderOpen className="h-4 w-4" />
            <span>{t("pos.suspendedSales", "Reprendre")}</span>
            {heldSales.length > 0 && (
              <span className="h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground font-bold text-[11px] flex items-center justify-center">
                {heldSales.length}
              </span>
            )}
            <span className="text-[10px] font-mono opacity-80">F9</span>
          </button>

          {/* Clear Cart F4 */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={clearCart}
            className="col-span-2 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t("pos.clearCart", "Vider le Panier")}</span>
            <span className="text-[10px] font-mono">F4</span>
          </button>
        </div>
      </div>
    </div>
  );
}
