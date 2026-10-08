"use client";

import React from "react";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ReceiptText,
  Printer,
  Edit2,
  Calendar,
  User,
  CreditCard,
  Banknote,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SaleDetailsModal({
  open,
  onOpenChange,
  sale,
  onPrint,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
  onPrint: (sale: any) => void;
  onEdit: (sale: any) => void;
}) {
  const { t, locale } = useI18n();

  if (!sale) return null;

  const totalAmount = Number(sale.totalAmount || 0);
  const discountAmount = Number(sale.discountAmount || 0);
  const finalAmount = Number(sale.finalAmount || 0);
  const paidAmount = Number(sale.paidAmount || 0);
  const remainingAmount = Number(sale.remainingAmount || 0);

  const isReturned = sale.status === "RETURNED";
  const isHeld = sale.status === "HELD";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-3xl w-full"
    >
      <div className="space-y-5 select-none">
        {/* Modal Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-foreground">
                  {t("sales.details.title", "Détails de la Vente")}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {t("sales.table.invoice", "N° Ticket / Facture")} :{" "}
                  <span className="font-mono font-bold text-foreground">
                    {sale.invoiceNumber}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              {isReturned ? (
                <Badge
                  variant="destructive"
                  className="px-3 py-1 font-bold text-xs"
                >
                  {t("sales.filters.returned", "Retourné")}
                </Badge>
              ) : isHeld ? (
                <Badge
                  variant="warning"
                  className="px-3 py-1 font-bold text-xs"
                >
                  {t("sales.filters.held", "En attente")}
                </Badge>
              ) : (
                <Badge
                  variant="success"
                  className="px-3 py-1 font-bold text-xs"
                >
                  {t("sales.filters.completed", "Complété")}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Metadata Card: Date, Cashier, Customer, Method */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-muted/50 border border-border text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{t("sales.details.date", "Date d'émission")}</span>
            </div>
            <div className="font-semibold text-foreground">
              {new Date(sale.date || sale.createdAt).toLocaleDateString(
                locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR",
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>{t("sales.details.cashier", "Caissier")}</span>
            </div>
            <div className="font-semibold text-foreground font-mono">
              {sale.cashierName || "Admin"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>{t("sales.table.customer", "Client")}</span>
            </div>
            <div className="font-semibold text-foreground">
              {sale.customer ? (
                <span className="text-primary font-bold">
                  {sale.customer.fullName}
                </span>
              ) : (
                <span className="text-muted-foreground italic">
                  {t("sales.table.walkInCustomer", "Client Comptoir")}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
              {sale.paymentMethod === "CARD" ? (
                <CreditCard className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Banknote className="h-3.5 w-3.5 text-primary" />
              )}
              <span>{t("sales.table.method", "Mode")}</span>
            </div>
            <div className="font-semibold text-foreground">
              <Badge
                variant="outline"
                className="font-mono text-[11px] font-bold"
              >
                {sale.paymentMethod}
              </Badge>
            </div>
          </div>
        </div>

        {/* Customer Alert if Debt remaining */}
        {remainingAmount > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {t("sales.details.balanceDue", "Reste à payer (Dette)")} :{" "}
                <strong className="font-mono">
                  {formatCurrency(remainingAmount)}
                </strong>
              </span>
            </div>
            {sale.customer && (
              <span className="text-[11px] opacity-80">
                {t("customers.currentDebt", "Dette globale client")} :{" "}
                <strong className="font-mono">
                  {formatCurrency(sale.customer.credit)}
                </strong>
              </span>
            )}
          </div>
        )}

        {/* Items Table */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("sales.details.itemsList", "Articles Achetés")} (
            {sale.items?.length || 0})
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-muted/80 text-muted-foreground sticky top-0 border-b border-border">
                  <tr>
                    <th className="py-2 px-3 text-start font-semibold">
                      {t("sales.details.product", "Produit")}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold font-mono">
                      {t("sales.details.barcode", "Code-barres")}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold">
                      {t("sales.details.unitPrice", "Prix Unit.")}
                    </th>
                    <th className="py-2 px-3 text-center font-semibold">
                      {t("sales.details.quantity", "Quantité")}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold">
                      {t("sales.details.discount", "Remise")}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold">
                      {t("sales.details.subtotal", "Sous-total")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sale.items?.map((item: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-2 px-3 font-semibold text-foreground">
                        {item.product?.name || "Produit"}
                      </td>
                      <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                        {item.product?.primaryBarcode || "—"}
                      </td>
                      <td className="py-2 px-3 text-end font-mono text-foreground">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-muted text-foreground">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-end font-mono text-muted-foreground">
                        {Number(item.discount || 0) > 0
                          ? `${item.discount}%`
                          : "—"}
                      </td>
                      <td className="py-2 px-3 text-end font-mono font-bold text-foreground">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Notes or Remarks */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>{t("sales.details.notes", "Notes / Remarques")}</span>
              </div>
              <p className="text-xs text-foreground/90 italic whitespace-pre-wrap">
                {sale.notes ||
                  t("sales.details.noNotes", "Aucune note pour cette vente.")}
              </p>
            </div>

            {/* Payments history */}
            {sale.payments && sale.payments.length > 0 && (
              <div className="mt-3 pt-2 border-t border-border space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {t(
                      "sales.details.paymentsHistory",
                      "Historique des Règlements",
                    )}
                  </span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {sale.payments.map((p: any, pIdx: number) => (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between text-[11px] text-muted-foreground"
                    >
                      <span>
                        {new Date(p.createdAt).toLocaleDateString()} (
                        {p.paymentMethod})
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        +{formatCurrency(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amount Breakdown Totals */}
          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("sales.details.subtotalLabel", "Sous-total brut")}</span>
              <span className="font-mono font-semibold">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>
                  {t("sales.details.globalDiscount", "Remise globale")}
                </span>
                <span className="font-mono font-semibold">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm font-black text-foreground">
                {t("sales.details.netTotal", "Total Net")}
              </span>
              <span className="text-base font-black font-mono text-primary">
                {formatCurrency(finalAmount)}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground pt-1">
              <span>{t("sales.details.amountPaid", "Montant Payé")}</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(paidAmount)}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>
                {t("sales.details.balanceDue", "Reste à payer (Dette)")}
              </span>
              <span
                className={`font-mono font-bold ${
                  remainingAmount > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {t("sales.details.close", "Fermer")}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(sale)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold border border-border transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t("sales.details.editButton", "Modifier Vente")}</span>
            </button>

            <button
              type="button"
              onClick={() => onPrint(sale)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition-all active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{t("sales.details.printButton", "Imprimer Ticket")}</span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
