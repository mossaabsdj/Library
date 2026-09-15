"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { formatCurrency, playBeep, getProductImageUrl } from "@/lib/utils";
import { useLoading } from "@/contexts/LoadingContext";
import { LogoLoader } from "@/components/ui/logo-loader";
import {
  Package,
  Barcode as BarcodeIcon,
  DollarSign,
  Zap,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BarcodeModal } from "./BarcodeModal";

export function ProductModal({
  open,
  onOpenChange,
  productId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: number | null; // null to create, number to edit
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const { withLoading } = useLoading();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form Fields (Exact legacy database mapping: Nom, Code_Barre, Refference, Categorie, Image, Prix_Unit, Prix_Achat, Stock_Q, Sales_Rapid)
  const [name, setName] = useState("");
  const [primaryBarcode, setPrimaryBarcode] = useState("");
  const [reference, setReference] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [initialImage, setInitialImage] = useState("");
  const [stagedUploadPath, setStagedUploadPath] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [unitPrice, setUnitPrice] = useState<string>("0");
  const [purchasePrice, setPurchasePrice] = useState<string>("0");
  const [stockQuantity, setStockQuantity] = useState<string>("0");
  const [minimumStock, setMinimumStock] = useState<string>("5");
  const [salesRapid, setSalesRapid] = useState<boolean>(false);

  // Barcodes list for existing product
  const [barcodes, setBarcodes] = useState<any[]>([]);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeToEdit, setBarcodeToEdit] = useState<any | null>(null);

  // Available categories for autocomplete
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/products/categories")
      .then((res) => res.json())
      .then((cats) => setExistingCategories(cats || []))
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setName("");
    setPrimaryBarcode("");
    setReference("");
    setCategory("");
    setImage("");
    setInitialImage("");
    setStagedUploadPath(null);
    setUploadingImage(false);
    setUnitPrice("0");
    setPurchasePrice("0");
    setStockQuantity("0");
    setMinimumStock("5");
    setSalesRapid(false);
    setBarcodes([]);
    setErrorMsg(null);
  };

  const loadProductData = async (id: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const p = await res.json();
        setName(p.name || "");
        setPrimaryBarcode(p.primaryBarcode || "");
        setReference(p.reference || "");
        setCategory(p.category || "");
        setImage(p.image || "");
        setInitialImage(p.image || "");
        setStagedUploadPath(null);
        setUploadingImage(false);
        setUnitPrice(String(p.unitPrice || 0));
        setPurchasePrice(
          p.purchasePrice !== null && p.purchasePrice !== undefined
            ? String(p.purchasePrice)
            : "0",
        );
        setStockQuantity(String(p.stockQuantity || 0));
        setMinimumStock(String(p.minimumStock || 5));
        setSalesRapid(Boolean(p.salesRapid));
        setBarcodes(p.barcodes || []);
      }
    } catch {
      setErrorMsg(
        t("product.modal.loadError", "Erreur lors du chargement du produit."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (productId) {
        loadProductData(productId);
      } else {
        resetForm();
      }
    } else {
      // Modal closed: clean up uncommitted upload if any
      if (stagedUploadPath && stagedUploadPath !== initialImage) {
        fetch(`/api/upload?path=${encodeURIComponent(stagedUploadPath)}`, {
          method: "DELETE",
        }).catch(() => {});
      }
      setStagedUploadPath(null);
    }
  }, [open, productId]);

  // Calculations
  const uPrice = parseFloat(unitPrice) || 0;
  const pPrice = parseFloat(purchasePrice) || 0;
  const unitProfit = uPrice - pPrice;
  const profitMargin =
    uPrice > 0 ? ((unitProfit / uPrice) * 100).toFixed(1) : "0.0";

  // Stock status
  const stockNum = parseInt(stockQuantity, 10) || 0;
  const minStockNum = parseInt(minimumStock, 10) || 0;
  const stockStatus =
    stockNum <= 0
      ? {
          label: t("product.outOfStock", "Rupture de Stock"),
          color: "bg-destructive/15 text-destructive border-destructive/30",
        }
      : stockNum <= minStockNum
        ? {
            label: t("product.lowStock", "Stock Faible"),
            color:
              "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          }
        : {
            label: t("product.inStock", "En Stock"),
            color:
              "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          };

  // Image Upload helper: sends file to /api/upload and stores relative path
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so selecting the same file again triggers change
    e.target.value = "";

    try {
      setUploadingImage(true);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            t(
              "product.modal.uploadError",
              "Erreur lors du téléversement de l'image.",
            ),
        );
      }

      // If user uploaded another temporary image in this session, delete it
      if (stagedUploadPath && stagedUploadPath !== initialImage) {
        fetch(`/api/upload?path=${encodeURIComponent(stagedUploadPath)}`, {
          method: "DELETE",
        }).catch(() => {});
      }

      setStagedUploadPath(data.filePath);
      setImage(data.filePath);
      playBeep("success");
    } catch (err: any) {
      console.error("[Image Upload Error]:", err);
      setErrorMsg(
        err.message ||
          t(
            "product.modal.uploadError",
            "Erreur lors du téléversement de l'image.",
          ),
      );
      playBeep("error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    // If a temporary staged file was uploaded in this session, clean it up from disk
    if (stagedUploadPath && stagedUploadPath !== initialImage) {
      fetch(`/api/upload?path=${encodeURIComponent(stagedUploadPath)}`, {
        method: "DELETE",
      }).catch(() => {});
    }
    setStagedUploadPath(null);
    setImage("");
  };

  // Barcode actions
  const handleCopyBarcode = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(codeToCopy);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteBarcode = async (barcodeId: number) => {
    if (!confirm(t("common.confirm", "Confirmer la suppression ?"))) return;
    try {
      const res = await fetch(`/api/barcodes/${barcodeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        playBeep("success");
        setBarcodes((prev) => prev.filter((b) => b.id !== barcodeId));
      }
    } catch {
      playBeep("error");
    }
  };

  // Submit Product Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(
        t("product.modal.nameLabel", "Le nom du produit est obligatoire"),
      );
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      primaryBarcode: primaryBarcode.trim() || undefined,
      reference: reference.trim() || undefined,
      category: category.trim() || undefined,
      image: image.trim() ? image.trim() : null,
      unitPrice: parseFloat(unitPrice) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      minimumStock: parseInt(minimumStock, 10) || 5,
      salesRapid: Boolean(salesRapid),
    };

    try {
      await withLoading(
        async () => {
          const url = productId
            ? `/api/products/${productId}`
            : "/api/products";
          const method = productId ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Erreur lors de l'enregistrement.");
          }

          setStagedUploadPath(null);
          setInitialImage(image.trim() || "");
          playBeep("success");
          onSuccess();
          onOpenChange(false);
        },
        t(
          "product.modal.savingSky",
          "Enregistrement du produit en base de données...",
        ),
      );
    } catch (err: any) {
      playBeep("error");
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-5xl xl:max-w-6xl w-full"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 select-none w-full text-foreground"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Package className="h-5 w-5" />
              </div>
              <span>
                {productId
                  ? t("product.modal.sheetTitleEdit", "Modifier le Produit")
                  : t("product.modal.sheetTitleNew", "Nouveau Produit")}
              </span>
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            {productId ? (
              <span>
                {t(
                  "product.modal.sheetDescEdit",
                  "Consultez et modifiez les détails du produit, sa tarification et son stock.",
                )}{" "}
                &bull;{" "}
                <span className="font-mono text-primary font-bold">
                  ID: #{productId}
                </span>
              </span>
            ) : (
              t(
                "product.modal.sheetDescNew",
                "Remplissez les informations du produit, sa tarification et sa gestion de stock.",
              )
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            <div className="flex flex-col items-center gap-2">
              <LogoLoader size="md" />
              <span>
                {t(
                  "product.modal.loadingProduct",
                  "Chargement de la fiche produit...",
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="max-h-[75vh] overflow-y-auto pr-1 space-y-4 scrollbar-thin">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* LEFT COLUMN: IDENTIFICATION & NOMENCLATURE + PRICING & STOCK */}
              <div className="lg:col-span-7 space-y-4">
                {/* SECTION 1: IDENTIFICATION & NOMENCLATURE */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b border-border">
                    <Package className="h-4 w-4" />
                    <span>
                      {t(
                        "product.modal.sec1Title",
                        "1. Identification & Nomenclature",
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-foreground block mb-1">
                        {t(
                          "product.modal.nameLabel",
                          "Nom du Produit (Désignation) *",
                        )}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t(
                          "product.modal.namePlaceholder",
                          "Ex: Coca Cola 1L, Stylos Bic...",
                        )}
                        required
                        autoFocus
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-input text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono font-semibold text-muted-foreground block mb-1">
                        {t("product.modal.refLabel", "Référence interne")}
                      </label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={t(
                          "product.modal.refPlaceholder",
                          "Ex: P-00125",
                        )}
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-input text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono font-semibold text-foreground block mb-1">
                        {t(
                          "product.modal.primaryBarcodeLabel",
                          "Code_Barre Principal",
                        )}
                      </label>
                      <div className="relative">
                        <BarcodeIcon className="absolute start-3 top-3 h-4 w-4 text-primary" />
                        <input
                          type="text"
                          value={primaryBarcode}
                          onChange={(e) => setPrimaryBarcode(e.target.value)}
                          placeholder={t(
                            "product.modal.primaryBarcodePlaceholder",
                            "Scanner ou saisir le code-barre...",
                          )}
                          className="w-full h-10 ps-9 pe-3 rounded-xl bg-background border border-input text-xs font-mono text-primary font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        {t("product.modal.categoryLabel", "Catégorie")}
                      </label>
                      <input
                        type="text"
                        list="categories-list"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder={t(
                          "product.modal.categoryPlaceholder",
                          "Ex: Boissons, Papeterie...",
                        )}
                        className="w-full h-10 px-3.5 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                      <datalist id="categories-list">
                        {existingCategories.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Quick Sale Toggle */}
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground">
                          {t(
                            "product.modal.quickSaleTitle",
                            "Vente Rapide (Sales_Rapid)",
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {t(
                            "product.modal.quickSaleDesc",
                            "Afficher sur le pavé tactile de vente rapide au comptoir",
                          )}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={salesRapid}
                      onChange={(e) => setSalesRapid(e.target.checked)}
                      className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                {/* SECTION 2: TARIFICATION & GESTION DU STOCK */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b border-border">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {t(
                        "product.modal.sec2Title",
                        "2. Tarification & Gestion du Stock",
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-primary block mb-1">
                        {t(
                          "product.modal.sellingPriceLabel",
                          "Prix de Vente (DA) *",
                        )}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        required
                        className="w-full h-11 px-3 rounded-xl bg-primary/10 border border-primary/30 text-base font-black text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        {t(
                          "product.modal.purchasePriceLabel",
                          "Prix d'Achat (DA)",
                        )}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-background border border-input text-base font-black text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        {t(
                          "product.modal.initialStockLabel",
                          "Stock Initial / Dispo",
                        )}
                      </label>
                      <input
                        type="number"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-background border border-input text-base font-black text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        {t(
                          "product.modal.minAlertStockLabel",
                          "Seuil Min. d'Alerte",
                        )}
                      </label>
                      <input
                        type="number"
                        value={minimumStock}
                        onChange={(e) => setMinimumStock(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-background border border-input text-base font-black text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Profit, Margin & Stock Status Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-muted/60 border border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t(
                          "product.modal.unitProfitLabel",
                          "Bénéfice Unitaire :",
                        )}
                      </span>
                      <span
                        className={`font-mono font-bold text-sm ${unitProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                      >
                        {formatCurrency(unitProfit)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/60 border border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t(
                          "product.modal.profitMarginLabel",
                          "Marge Bénéficiaire :",
                        )}
                      </span>
                      <span
                        className={`font-mono font-bold text-sm ${parseFloat(profitMargin) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                      >
                        {profitMargin} %
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between font-bold text-xs ${stockStatus.color}`}
                    >
                      <span>
                        {t("product.modal.stockStateLabel", "État Stock :")}
                      </span>
                      <span>{stockStatus.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: IMAGE & CODES-BARRES ADDITIONNELS */}
              <div className="lg:col-span-5 space-y-4 flex flex-col">
                {/* SECTION 3: IMAGE (OPTIONNELLE) */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-border">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <ImageIcon className="h-4 w-4" />
                      <span>
                        {t(
                          "product.modal.sec3Title",
                          "3. Image du Produit (Optionnelle)",
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium italic">
                      {t(
                        "product.modal.optionalNotice",
                        "Sélection non obligatoire",
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    {/* Thumbnail Preview */}
                    <div className="h-24 w-24 rounded-2xl bg-muted border border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 text-primary">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {t("product.modal.uploading", "Envoi...")}
                          </span>
                        </div>
                      ) : image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getProductImageUrl(image)}
                          alt={name || "Produit"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Image controls: file upload or url */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label
                          className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold border border-primary/20 transition-colors ${
                            uploadingImage
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }`}
                        >
                          {uploadingImage ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {uploadingImage
                              ? t("product.modal.uploading", "Téléversement...")
                              : t(
                                  "product.modal.chooseImage",
                                  "Choisir une image",
                                )}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                        {image && !uploadingImage && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-2.5 py-1.5 rounded-xl text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors"
                          >
                            {t("product.modal.removeImage", "Retirer")}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder={t(
                          "product.modal.imageUrlPlaceholder",
                          "Ou collez une URL / chemin...",
                        )}
                        className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: CODES-BARRES ADDITIONNELS */}
                <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between pb-1 border-b border-border">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <BarcodeIcon className="h-4 w-4" />
                      <span>
                        {t(
                          "product.modal.sec4Title",
                          "4. Codes-barres Additionnels",
                        )}{" "}
                        {productId ? `(${barcodes.length})` : ""}
                      </span>
                    </div>
                    {productId && (
                      <button
                        type="button"
                        onClick={() => {
                          setBarcodeToEdit(null);
                          setBarcodeModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <Plus className="h-3 w-3" />
                        <span>
                          {t(
                            "product.modal.addBarcodeButton",
                            "+ Ajouter un code",
                          )}
                        </span>
                      </button>
                    )}
                  </div>

                  {productId ? (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 flex-1">
                      {barcodes.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                          {t(
                            "product.modal.noAdditionalBarcodes",
                            "Aucun code additionnel.",
                          )}
                        </div>
                      ) : (
                        barcodes.map((b) => (
                          <div
                            key={b.id}
                            className="p-2 rounded-xl bg-muted/60 border border-border flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <BarcodeIcon className="h-3.5 w-3.5 text-primary" />
                              <span className="font-mono font-bold text-xs text-foreground">
                                {b.code}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyBarcode(b.code)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                title={t("product.copyBarcode", "Copier")}
                              >
                                {copiedCode === b.code ? (
                                  <Check className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBarcodeToEdit(b);
                                  setBarcodeModalOpen(true);
                                }}
                                className="p-1 rounded-lg text-muted-foreground hover:text-amber-500 transition-colors"
                                title={t("common.edit", "Modifier")}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBarcode(b.id)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                title={t("common.delete", "Supprimer")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="py-6 px-4 text-center rounded-xl bg-muted/40 border border-dashed border-border flex flex-col items-center justify-center flex-1 text-muted-foreground text-xs space-y-1">
                      <BarcodeIcon className="h-8 w-8 text-muted-foreground/40 mb-1" />
                      <p className="font-medium text-foreground text-xs">
                        {t(
                          "product.modal.sec4NewNotice",
                          "Codes-barres multiples disponibles après enregistrement.",
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t(
                          "product.modal.sec4NewNoticeSub",
                          "Définissez le code principal ci-contre pour commencer.",
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
          >
            {t("common.cancel", "Annuler")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
          >
            {saving ? (
              <LogoLoader size="sm" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>
              {t("product.modal.saveButton", "Enregistrer le Produit")}
            </span>
          </button>
        </div>
      </form>

      {/* Sub-dialog for adding/editing Barcode */}
      {productId && (
        <BarcodeModal
          open={barcodeModalOpen}
          onOpenChange={setBarcodeModalOpen}
          productId={productId}
          productName={name}
          barcodeToEdit={barcodeToEdit}
          onSuccess={() => {
            loadProductData(productId);
          }}
        />
      )}
    </Dialog>
  );
}
