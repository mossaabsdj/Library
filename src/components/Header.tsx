"use client";

import React, { useState, useEffect } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  Maximize,
  Minimize,
  ShoppingCart,
  Clock,
  Menu,
  Moon,
  Sun,
  PackagePlus,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";

export function Header({ title }: { title?: string }) {
  const { t, locale } = useI18n();
  const { toggleSidebar, openGlobalProductModal, mode, toggleDarkMode } =
    useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(
          locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          },
        ),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [locale]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/95 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none transition-colors">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={t("header.toggleSidebar", "Ouvrir / Réduire le menu latéral")}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
          {title || t("app.title", "SmartPOS")}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        {/* + Nouveau Produit Button */}
        <button
          type="button"
          onClick={openGlobalProductModal}
          title={t("header.newProduct", "+ Nouveau Produit")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <PackagePlus className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t("header.newProduct", "+ Nouveau Produit")}
          </span>
          <span className="sm:hidden">+</span>
        </button>

        {/* Quick sale shortcut button */}
        <Link
          href="/pos"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 text-xs font-semibold transition-colors"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>{t("app.pos", "Vente Comptoir")} [F1]</span>
        </Link>

        {/* Clock */}
        {isFullscreen ? (
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{time}</span>
          </div>
        ) : null}

        {/* Dark Mode / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={
            mode === "dark"
              ? t("header.themeToLight", "Passer en Mode Blanc & Bleu")
              : t("header.themeToDark", "Passer en Mode Sombre")
          }
        >
          {mode === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Language Switcher  <LanguageSwitcher /> */}

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={t("header.fullscreen", "Plein écran (F11)")}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
