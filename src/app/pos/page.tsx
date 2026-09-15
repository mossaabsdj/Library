"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PosSearch } from "@/features/pos/PosSearch";
import { PosCart } from "@/features/pos/PosCart";
import { PosQuickSale } from "@/features/pos/PosQuickSale";
import { PosVisualCatalog } from "@/features/pos/PosVisualCatalog";
import { PaymentModal } from "@/features/pos/PaymentModal";
import { CustomerSelectModal } from "@/features/pos/CustomerSelectModal";
import { HeldSalesModal } from "@/features/pos/HeldSalesModal";
import { ReceiptModal } from "@/features/pos/ReceiptModal";
import { PosTicketTabs } from "@/features/pos/PosTicketTabs";
import { usePos } from "@/features/pos/posState";
import { useI18n } from "@/contexts/I18nContext";
import { Zap, LayoutGrid, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PosPage() {
  const { cart, clearCart, tickets } = usePos();
  const { t } = useI18n();

  const [activeCatalogTab, setActiveCatalogTab] = useState<"quick" | "catalog">(
    "quick",
  );
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isHeldSalesListOpen, setIsHeldSalesListOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Global Keyboard Shortcuts (F1 to F9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setIsCustomerSelectOpen(true);
      } else if (e.key === "F3") {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentOpen(true);
      } else if (e.key === "F4") {
        e.preventDefault();
        clearCart();
      } else if (e.key === "F5") {
        e.preventDefault();
        setActiveCatalogTab((prev) => (prev === "quick" ? "catalog" : "quick"));
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) setIsHoldModalOpen(true);
      } else if (e.key === "F9") {
        e.preventDefault();
        setIsHeldSalesListOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, clearCart]);

  return (
    <AppLayout title={t("pos.title", "Vente en Comptoir (POS)")}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 end-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur text-sm font-bold animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === "success"
              ? "bg-blue-600/95 text-white"
              : "bg-rose-600/95 text-white"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-3 select-none">
        {/* Head Tabs: Multiple sales selection bar */}
        <div className="flex items-center justify-between gap-3 bg-card text-card-foreground p-2 rounded-2xl border border-border shadow-sm shrink-0">
          <div className="flex-1 min-w-0">
            <PosTicketTabs />
          </div>
        </div>

        {/* Main Columns Container */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Left Column: Fast Barcode/Search + Quick Sale / Catalog Grid */}
          <div className="flex-1 flex flex-col min-w-0 h-full space-y-3">
            {/* Barcode / Product Search Input Bar */}
            <PosSearch />

            {/* Catalog & Quick Sale Controls */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 p-1 bg-card rounded-xl border border-border shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveCatalogTab("quick")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeCatalogTab === "quick"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>{t("pos.quickSale", "Vente Rapide [F5]")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCatalogTab("catalog")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeCatalogTab === "catalog"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>{t("pos.visualCatalog", "Catalogue Visuel")}</span>
                  </button>
                </div>

                {/* Keyboard helper hints   <div className="hidden xl:flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                  <span>[F1] {t("shortcuts.f1", "Scan/Chercher")}</span>
                  <span>[F2] {t("shortcuts.f2", "Client")}</span>
                  <span>[F3] {t("shortcuts.f3", "Paiement")}</span>
                  <span>[F8] {t("shortcuts.f8", "Attente")}</span>
                </div> */}
              </div>

              {/* Grid Container */}
              <div className="flex-1 min-h-0">
                {activeCatalogTab === "quick" ? (
                  <PosQuickSale onShowToast={showToast} />
                ) : (
                  <PosVisualCatalog onShowToast={showToast} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Active Cart (always visible) */}
          <div className="w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 h-full">
            <PosCart
              onOpenPayment={() => setIsPaymentOpen(true)}
              onOpenCustomerSelect={() => setIsCustomerSelectOpen(true)}
              onOpenHoldModal={() => setIsHoldModalOpen(true)}
              onOpenHeldSalesList={() => setIsHeldSalesListOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        onSuccess={(sale) => setCompletedSale(sale)}
      />

      <CustomerSelectModal
        open={isCustomerSelectOpen}
        onOpenChange={setIsCustomerSelectOpen}
      />

      <HeldSalesModal
        open={isHoldModalOpen}
        onOpenChange={setIsHoldModalOpen}
        mode="hold"
      />

      <HeldSalesModal
        open={isHeldSalesListOpen}
        onOpenChange={setIsHeldSalesListOpen}
        mode="list"
      />

      <ReceiptModal
        open={Boolean(completedSale)}
        onOpenChange={(open) => {
          if (!open) setCompletedSale(null);
        }}
        sale={completedSale}
      />
    </AppLayout>
  );
}
