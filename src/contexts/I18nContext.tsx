"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import fr from "@/locales/fr.json";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

export type Language = "fr" | "ar" | "en";

const translations: Record<Language, Record<string, unknown>> = {
  fr,
  ar,
  en,
};

interface I18nContextType {
  language: Language;
  locale: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("smartpos_lang") as Language | null;
    if (saved && (saved === "fr" || saved === "ar" || saved === "en")) {
      setLanguageState(saved);
      applyLanguageSettings(saved);
    } else {
      applyLanguageSettings("fr");
    }
  }, []);

  const applyLanguageSettings = (lang: Language) => {
    if (typeof document !== "undefined") {
      const isRtl = lang === "ar";
      document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", lang);
      if (isRtl) {
        document.documentElement.classList.add("rtl");
      } else {
        document.documentElement.classList.remove("rtl");
      }
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("smartpos_lang", lang);
    applyLanguageSettings(lang);
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current: unknown = translations[language] ?? translations.fr;

    for (const key of keys) {
      if (
        current &&
        typeof current === "object" &&
        key in (current as Record<string, unknown>)
      ) {
        current = (current as Record<string, unknown>)[key];
      } else {
        // Fallback to French if not found in current language
        let fallbackCurrent: unknown = translations.fr;
        for (const fKey of keys) {
          if (
            fallbackCurrent &&
            typeof fallbackCurrent === "object" &&
            fKey in (fallbackCurrent as Record<string, unknown>)
          ) {
            fallbackCurrent = (fallbackCurrent as Record<string, unknown>)[
              fKey
            ];
          } else {
            return fallback ?? path;
          }
        }
        return typeof fallbackCurrent === "string"
          ? fallbackCurrent
          : (fallback ?? path);
      }
    }

    return typeof current === "string" ? current : (fallback ?? path);
  };

  const isRtl = language === "ar";

  return (
    <I18nContext.Provider
      value={{ language, locale: language, setLanguage, t, isRtl }}
    >
      <div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "font-arabic" : ""}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
