"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useI18n, type Language } from "@/contexts/I18nContext";
import { useTheme, ThemeColor, ThemeMode } from "@/contexts/ThemeContext";
import { useLoading } from "@/contexts/LoadingContext";
import { playBeep } from "@/lib/utils";
import {
  Settings,
  Store,
  Receipt,
  ShieldAlert,
  CheckCircle2,
  Palette,
  Sun,
  Moon,
  Monitor,
  Layout,
  Check,
  Volume2,
  Save,
  Sparkles,
  Globe,
} from "lucide-react";

export default function SettingsPage() {
  const { language, setLanguage, t, isRtl } = useI18n();
  const {
    mode,
    setMode,
    themeColor,
    setThemeColor,
    isSidebarCollapsed,
    setSidebarCollapsed,
  } = useTheme();
  const { withLoading } = useLoading();

  const [storeName, setStoreName] = useState("Mon Magasin / متجري");
  const [phone, setPhone] = useState("0550 00 00 00");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("Alger, Algérie");
  const [currency, setCurrency] = useState("DA");
  const [receiptHeader, setReceiptHeader] = useState("Bienvenue / مرحبا بكم");
  const [receiptFooter, setReceiptFooter] = useState(
    "Merci pour votre visite! / شكراً لزيارتكم",
  );
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [enableSoundEffects, setEnableSoundEffects] = useState(true);
  const [enableBarcodeBeep, setEnableBarcodeBeep] = useState(true);

  // Field-specific instant feedback status
  const [savedStatus, setSavedStatus] = useState<{ [key: string]: boolean }>(
    {},
  );

  const showSavedIndicator = (fieldKey: string) => {
    setSavedStatus((prev) => ({ ...prev, [fieldKey]: true }));
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [fieldKey]: false }));
    }, 2000);
  };

  const languageOptions: {
    code: Language;
    badge: string;
    title: string;
    desc: string;
  }[] = [
    {
      code: "fr",
      badge: "FR",
      title: t("settings.langFr", "Français"),
      desc: t("settings.langFrDesc", "Interface complète en français (LTR)"),
    },
    {
      code: "ar",
      badge: "العربية",
      title: t("settings.langAr", "العربية"),
      desc: t("settings.langArDesc", "واجهة كاملة باللغة العربية مع دعم RTL"),
    },
    {
      code: "en",
      badge: "EN",
      title: t("settings.langEn", "English"),
      desc: t("settings.langEnDesc", "Full English user interface (LTR)"),
    },
  ];

  const colorOptions: { id: ThemeColor; name: string; bg: string }[] = [
    { id: "blue", name: "Bleu Océan (Défaut)", bg: "bg-blue-600" },
    { id: "emerald", name: "Émeraude Moderne", bg: "bg-emerald-600" },
    { id: "indigo", name: "Indigo Tech", bg: "bg-indigo-600" },
    { id: "purple", name: "Violet Royal", bg: "bg-purple-600" },
  ];

  // Load existing settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((s) => {
        if (s && !s.error) {
          setStoreName(s.storeName || "Mon Magasin");
          setPhone(s.phone || "");
          setEmail(s.email || "");
          setAddress(s.address || "");
          setCurrency(s.currency || "DA");
          setReceiptHeader(s.receiptHeader || "");
          setReceiptFooter(s.receiptFooter || "");
          setLowStockThreshold(String(s.lowStockThreshold || 5));
          const negStock = Boolean(s.allowNegativeStock);
          setAllowNegativeStock(negStock);
          try {
            localStorage.setItem(
              "smartpos_allow_negative_stock",
              JSON.stringify(negStock),
            );
          } catch {
            // ignore
          }
          setEnableSoundEffects(s.enableSoundEffects !== false);
          setEnableBarcodeBeep(s.enableBarcodeBeep !== false);
          if (
            s.themeMode &&
            (s.themeMode === "light" ||
              s.themeMode === "dark" ||
              s.themeMode === "system")
          ) {
            setMode(s.themeMode as ThemeMode);
          }
          if (s.themeColor) {
            setThemeColor(s.themeColor);
          }
        }
      })
      .catch(() => {});
  }, [setMode, setThemeColor]);

  // Instant single-setting patch function: saves immediately on click/blur/toggle
  const saveSingleSetting = async (
    fieldKey: string,
    data: Record<string, any>,
  ) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        playBeep("click");
        showSavedIndicator(fieldKey);
      }
    } catch (e) {
      playBeep("error");
    }
  };

  // Button Action: Switch Language Immediately
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    playBeep("click");
    showSavedIndicator("language");
  };

  // Button Action: Toggle Mode Immediately
  const handleModeChange = async (newMode: ThemeMode) => {
    setMode(newMode);
    await saveSingleSetting("themeMode", { themeMode: newMode });
  };

  // Button Action: Change Palette Immediately
  const handleColorChange = async (color: ThemeColor) => {
    setThemeColor(color);
    await saveSingleSetting("themeColor", { themeColor: color });
  };

  // Button Action: Toggle Sidebar
  const handleSidebarToggle = (val: boolean) => {
    setSidebarCollapsed(val);
    showSavedIndicator("sidebar");
  };

  // Button Action: Toggle Negative Stock
  const handleToggleNegativeStock = async (val: boolean) => {
    setAllowNegativeStock(val);
    try {
      localStorage.setItem(
        "smartpos_allow_negative_stock",
        JSON.stringify(val),
      );
      window.dispatchEvent(
        new CustomEvent("settings-updated", {
          detail: { allowNegativeStock: val },
        }),
      );
    } catch {
      // ignore
    }
    await saveSingleSetting("allowNegativeStock", { allowNegativeStock: val });
  };

  // Button Action: Toggle Sound Effects
  const handleToggleSounds = async (val: boolean) => {
    setEnableSoundEffects(val);
    await saveSingleSetting("enableSoundEffects", { enableSoundEffects: val });
  };

  // Button Action: Toggle Barcode Beep
  const handleToggleBarcodeBeep = async (val: boolean) => {
    setEnableBarcodeBeep(val);
    await saveSingleSetting("enableBarcodeBeep", { enableBarcodeBeep: val });
  };

  // Button Action: Test Sound
  const handleTestSound = () => {
    playBeep("success");
    showSavedIndicator("testSound");
  };

  // Button Action: Save Store Info Block with Floating Sky Loader
  const handleSaveStoreInfo = async () => {
    await withLoading(async () => {
      await saveSingleSetting("storeInfo", {
        storeName,
        phone,
        email,
        address,
        currency,
      });
    }, "Mise à jour des coordonnées du magasin...");
  };

  // Button Action: Save Ticket Template Block with Floating Sky Loader
  const handleSaveTicket = async () => {
    await withLoading(async () => {
      await saveSingleSetting("receipt", {
        receiptHeader,
        receiptFooter,
      });
    }, "Mise à jour du ticket thermique...");
  };

  // Button Action: Save Inventory Rules Block with Floating Sky Loader
  const handleSaveInventoryRules = async () => {
    await withLoading(async () => {
      await saveSingleSetting("inventory", {
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
        allowNegativeStock,
      });
    }, "Mise à jour des règles d'inventaire...");
  };

  return (
    <AppLayout title={t("settings.title", "Paramètres Généraux")}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header de Page */}
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <span>
              {t("settings.title", "Paramètres Généraux du Point de Vente")}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              "settings.subtitle",
              "Chaque modification s'exécute et s'enregistre immédiatement en direct sans délai",
            )}
          </p>
        </div>

        {/* 1. SECTION THEME & AFFICHAGE */}
        <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {t("settings.themeTitle", "Thème & Apparence Visuelle")}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.themeSubtitle",
                    "Choisissez Blanc & Bleu, Sombre ou Synchronisé au Système OS — s'applique instantanément",
                  )}
                </p>
              </div>
            </div>
            {(savedStatus.themeMode ||
              savedStatus.themeColor ||
              savedStatus.sidebar) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("settings.appliedLive", "Appliqué en direct")}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Mode Sombre / Mode Clair / Mode Système */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">
                {t("settings.displayMode", "Mode d'Affichage")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleModeChange("light")}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left rtl:text-right transition-all ${
                    mode === "light"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-bold"
                      : "border-border bg-muted/30 text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground">
                      {t("settings.themeLight", "Thème Blanc & Bleu")}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {t(
                        "settings.themeLightDesc",
                        "Luminosité et contraste caisse",
                      )}
                    </div>
                  </div>
                  {mode === "light" && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("dark")}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left rtl:text-right transition-all ${
                    mode === "dark"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-bold"
                      : "border-border bg-muted/30 text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground">
                      {t("settings.themeDark", "Mode Sombre (Dark)")}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {t("settings.themeDarkDesc", "Confort visuel nocturne")}
                    </div>
                  </div>
                  {mode === "dark" && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("system")}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left rtl:text-right transition-all ${
                    mode === "system"
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-bold"
                      : "border-border bg-muted/30 text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground">
                      {t("settings.themeSystem", "Système (Auto OS)")}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {t("settings.themeSystemDesc", "S'adapte à Windows")}
                    </div>
                  </div>
                  {mode === "system" && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Thème de Couleur (Palette) */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">
                {t(
                  "settings.accentColor",
                  "Couleur d'Accentuation (S'exécute immédiatement au clic)",
                )}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {colorOptions.map((c) => {
                  const isSelected = themeColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleColorChange(c.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 font-bold text-foreground ring-2 ring-primary/20"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full ${c.bg} shrink-0 ring-1 ring-black/10`}
                      />
                      <span className="truncate">{c.name}</span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 ms-auto text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Latéral Réduit */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                <Layout className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-bold text-xs text-foreground">
                    {t(
                      "settings.compactSidebar",
                      "Menu Latéral Réduit (Compact)",
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t(
                      "settings.compactSidebarDesc",
                      "Masque le texte du menu latéral pour maximiser l'espace écran",
                    )}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isSidebarCollapsed}
                onChange={(e) => handleSidebarToggle(e.target.checked)}
                className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. SECTION LANGUE DE L'APPLICATION */}
        <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {t("settings.languageTitle", "Langue de l'Application")}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.languageSubtitle",
                    "Choisissez la langue de l'interface — change instantanément le texte et la direction (LTR / RTL)",
                  )}
                </p>
              </div>
            </div>
            {savedStatus.language && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("settings.appliedLive", "Appliqué en direct")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {languageOptions.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left rtl:text-right transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-bold"
                      : "border-border bg-muted/30 text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary font-mono text-xs font-black shrink-0">
                    {lang.badge}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground">
                      {lang.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {lang.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SECTION EFFETS SONORES & BIP SCANNER */}
        <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {t(
                    "settings.soundsTitle",
                    "Effets Sonores & Bip Code-Barres",
                  )}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.soundsSubtitle",
                    "Confirmation audio lors des scans et de la validation de vente",
                  )}
                </p>
              </div>
            </div>
            {savedStatus.testSound && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Bip testé !
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
              <div>
                <div className="font-bold text-xs text-foreground">
                  {t("settings.barcodeBeep", "Bip Audio au Scan")}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.barcodeBeepDesc",
                    "Émet un bip instantané à chaque scan valide",
                  )}
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableBarcodeBeep}
                onChange={(e) => handleToggleBarcodeBeep(e.target.checked)}
                className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
              <div>
                <div className="font-bold text-xs text-foreground">
                  {t("settings.validationSound", "Sons de Validation Vente")}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.validationSoundDesc",
                    "Jingle de succès lors de l'encaissement",
                  )}
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableSoundEffects}
                onChange={(e) => handleToggleSounds(e.target.checked)}
                className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleTestSound}
              className="h-9 px-3 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-foreground flex items-center gap-1.5 transition-all"
            >
              <Volume2 className="h-3.5 w-3.5 text-primary" />
              <span>{t("settings.testSound", "Tester le Son")}</span>
            </button>
          </div>
        </div>

        {/* 4. SECTION IDENTITÉ DU COMMERCE */}
        <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {t("settings.storeTitle", "Identité du Commerce & Devise")}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.storeSubtitle",
                    "Chaque champ s'enregistre dès que vous quittez la case",
                  )}
                </p>
              </div>
            </div>
            {savedStatus.storeInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("settings.appliedLive", "Coordonnées enregistrées")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("settings.storeName", "Nom du Commerce / Magasin")}
                </label>
                {savedStatus.storeName && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="h-3 w-3" />{" "}
                    {t("settings.autoSaved", "Auto-enregistré")}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                onBlur={() => saveSingleSetting("storeName", { storeName })}
                className="w-full h-11 px-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  {t(
                    "settings.currency",
                    "Devise Monétaire (DA, DZD, €, $, etc.)",
                  )}
                </label>
                {savedStatus.currency && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="h-3 w-3" />{" "}
                    {t("settings.autoSaved", "Auto-enregistré")}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                onBlur={() => saveSingleSetting("currency", { currency })}
                className="w-full h-11 px-3 rounded-xl bg-background border border-input text-sm font-mono font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("settings.phone", "Numéro de Téléphone")}
                </label>
                {savedStatus.phone && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="h-3 w-3" />{" "}
                    {t("settings.autoSaved", "Auto-enregistré")}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => saveSingleSetting("phone", { phone })}
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("settings.address", "Adresse du Magasin")}
                </label>
                {savedStatus.address && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="h-3 w-3" />{" "}
                    {t("settings.autoSaved", "Auto-enregistré")}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={() => saveSingleSetting("address", { address })}
                className="w-full h-10 px-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveStoreInfo}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <Save className="h-4 w-4" />
              <span>
                {t("settings.saveStore", "Enregistrer Coordonnées Magasin")}
              </span>
            </button>
          </div>
        </div>

        {/* 5. SECTION TICKET DE CAISSE THERMIQUE */}
        <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {t(
                    "settings.receiptTitle",
                    "Ticket de Caisse Thermique (80mm / 58mm)",
                  )}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.receiptSubtitle",
                    "Message d'accueil et de remerciement imprimé sur les reçus",
                  )}
                </p>
              </div>
            </div>
            {savedStatus.receipt && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ticket mis à jour
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("settings.receiptHeader", "En-tête du Ticket (Bienvenue)")}
                </label>
                {savedStatus.receiptHeader && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="h-3 w-3" />{" "}
                    {t("settings.autoSaved", "Auto-enregistré")}
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                onBlur={() =>
                  saveSingleSetting("receiptHeader", { receiptHeader })
                }
                className="w-full p-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  {t("settings.receiptFooter", "Pied du Ticket (Remerciement)")}
                </label>
                {savedStatus.receiptFooter && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="h-3 w-3" />{" "}
                    {t("settings.autoSaved", "Auto-enregistré")}
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                onBlur={() =>
                  saveSingleSetting("receiptFooter", { receiptFooter })
                }
                className="w-full p-3 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveTicket}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <Save className="h-4 w-4" />
              <span>
                {t("settings.saveReceipt", "Enregistrer Modèle Ticket")}
              </span>
            </button>
          </div>
        </div>

        {/* 6. SECTION REGLES D'INVENTAIRE & CAISSE */}
        <div className="p-5 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {t("settings.inventoryTitle", "Règles d'Inventaire & Caisse")}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.inventorySubtitle",
                    "Alerte de rupture de stock et politique de vente à découvert",
                  )}
                </p>
              </div>
            </div>
            {savedStatus.inventory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("settings.appliedLive", "Règles enregistrées")}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
              <div>
                <div className="font-bold text-xs text-foreground">
                  {t(
                    "settings.lowStockThreshold",
                    "Seuil d'Alerte Stock Faible Défaut",
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.lowStockThresholdDesc",
                    "Déclenche le voyant d'alerte dès que la quantité est ≤ cette valeur",
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  onBlur={() =>
                    saveSingleSetting("lowStockThreshold", {
                      lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
                    })
                  }
                  className="w-20 h-10 px-3 text-center rounded-xl bg-background border border-input font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {savedStatus.lowStockThreshold && (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
              <div>
                <div className="font-bold text-xs text-foreground">
                  {t(
                    "settings.allowNegativeStock",
                    "Autoriser la Vente à Découvert (Stock Négatif)",
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t(
                    "settings.allowNegativeStockDesc",
                    "Permet d'enregistrer une vente même lorsque le stock calculé est insuffisant",
                  )}
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowNegativeStock}
                onChange={(e) => handleToggleNegativeStock(e.target.checked)}
                className="h-5 w-5 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveInventoryRules}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <Save className="h-4 w-4" />
              <span>
                {t("settings.saveInventory", "Enregistrer Règles d'Inventaire")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
