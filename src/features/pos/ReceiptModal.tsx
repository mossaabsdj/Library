"use client";

import React, { useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { Printer, CheckCircle2, ArrowRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ReceiptModal({
  open,
  onOpenChange,
  sale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
}) {
  const { t, locale } = useI18n();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4 select-none">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
            <DialogTitle className="text-xl font-black text-foreground">
              {t("pos.receipt.saleRecorded", "Vente Enregistrée !")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {t("pos.receipt.ticketNumber", "Ticket N°")}{" "}
            <span className="font-mono font-bold text-foreground">
              {sale.invoiceNumber}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Printable 80mm Thermal Receipt Preview - Always Black on White for physical printers */}
        <div
          id="printable-receipt"
          ref={receiptRef}
          className="p-4 rounded-xl bg-white text-black font-mono text-xs shadow-inner space-y-3 max-h-96 overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-2">
            <div className="font-black text-base uppercase">
              {t("pos.receipt.storeName", "SmartPOS Store")}
            </div>
            <div className="text-[11px] text-gray-600">
              {t("pos.receipt.storeSubtitle", "Alimentation & Papeterie")}
            </div>
            <div className="text-[10px] text-gray-600">
              Tel: 0550 00 00 00 • Alger
            </div>
            <div className="text-[10px] text-gray-500 pt-1">
              {t("pos.receipt.ticket", "Ticket :")} {sale.invoiceNumber}
            </div>
            <div className="text-[10px] text-gray-500">
              {t("pos.receipt.date", "Date :")}{" "}
              {new Date(sale.date || sale.createdAt).toLocaleString(
                locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR",
              )}
            </div>
            {sale.customer && (
              <div className="text-[11px] font-bold text-gray-800 pt-0.5">
                {t("pos.receipt.client", "Client :")} {sale.customer.fullName}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-1 border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-gray-300">
              <span>{t("pos.receipt.designation", "Désignation")}</span>
              <span className="text-end">
                {t("pos.receipt.total", "Total")}
              </span>
            </div>
            {sale.items?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between text-[11px] leading-tight"
              >
                <div className="truncate max-w-[180px]">
                  <div>{item.product?.name || item.name}</div>
                  <div className="text-[10px] text-gray-500">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </div>
                </div>
                <div className="font-bold text-end">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="space-y-1 text-[11px] font-bold">
            <div className="flex justify-between">
              <span>{t("pos.receipt.subtotal", "Sous-total :")}</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
            {Number(sale.discountAmount) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{t("pos.receipt.discount", "Remise :")}</span>
                <span>-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-300">
              <span>{t("pos.receipt.netToPay", "NET À PAYER :")}</span>
              <span>{formatCurrency(sale.finalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>
                {t("pos.receipt.paid", "Payé")} ({sale.paymentMethod}) :
              </span>
              <span>{formatCurrency(sale.paidAmount)}</span>
            </div>
            {Number(sale.remainingAmount) > 0 ? (
              <div className="flex justify-between text-red-600 font-black">
                <span>
                  {t("pos.receipt.remainingCredit", "RESTE DÛ (CRÉDIT) :")}
                </span>
                <span>{formatCurrency(sale.remainingAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-gray-700">
                <span>
                  {t("pos.receipt.changeReturned", "Monnaie rendue :")}
                </span>
                <span>
                  {formatCurrency(
                    Math.max(
                      0,
                      Number(sale.paidAmount) - Number(sale.finalAmount),
                    ),
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-gray-500 pt-2 border-t border-dashed border-gray-400">
            {t("pos.receipt.thankYou", "Merci de votre visite et à bientôt !")}
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="h-12 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center gap-2 transition-colors border border-border"
          >
            <Printer className="h-5 w-5 text-primary" />
            <span>{t("pos.receipt.printTicket", "Imprimer Ticket")}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
          >
            <span>{t("pos.receipt.newSale", "Nouvelle Vente")}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Dialog>
  );
}
