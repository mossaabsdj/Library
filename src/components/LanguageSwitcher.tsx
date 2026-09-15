"use client";

import React from "react";
import { useI18n, type Language } from "@/contexts/I18nContext";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  const languages: { code: Language; label: string }[] = [
    { code: "fr", label: "FR" },
    { code: "ar", label: "العربية" },
    { code: "en", label: "EN" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border">
      <div className="px-1.5 text-muted-foreground">
        <Globe className="h-3.5 w-3.5" />
      </div>
      {languages.map((lang) => {
        const isSelected = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
