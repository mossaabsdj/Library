"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ShoppingCart,
  Package,
  Layers,
  Truck,
  Users,
  Building2,
  DollarSign,
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Store,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isSidebarCollapsed } = useTheme();

  const navItems = [
    {
      href: "/pos",
      label: t("app.pos", "Vente Comptoir"),
      icon: ShoppingCart,
      isPos: true,
      shortcut: "F1",
    },
    {
      href: "/products",
      label: t("app.products", "Produits & Barcodes"),
      icon: Package,
    },
    {
      href: "/stock",
      label: t("app.stock", "Mouvements Stock"),
      icon: Layers,
    },
    {
      href: "/purchases",
      label: t("app.purchases", "Achats Fournisseurs"),
      icon: Truck,
    },
    {
      href: "/customers",
      label: t("app.customers", "Clients & Crédits"),
      icon: Users,
    },
    {
      href: "/suppliers",
      label: t("app.suppliers", "Fournisseurs & Dettes"),
      icon: Building2,
    },
    {
      href: "/expenses",
      label: t("app.expenses", "Dépenses"),
      icon: DollarSign,
    },
    {
      href: "/dashboard",
      label: t("app.dashboard", "Tableau de Bord"),
      icon: LayoutDashboard,
    },
    {
      href: "/reports",
      label: t("app.reports", "Rapports & Stats"),
      icon: BarChart3,
    },
    {
      href: "/import-export",
      label: t("app.importExport", "Import / Export"),
      icon: FileSpreadsheet,
    },
    {
      href: "/settings",
      label: t("app.settings", "Paramètres"),
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`flex-shrink-0 flex flex-col border-r border-border bg-card text-card-foreground h-screen sticky top-0 z-40 select-none transition-all duration-250 ease-in-out ${
        isSidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 shrink-0 text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 transition-opacity duration-200">
              <div className="font-extrabold text-base text-foreground tracking-tight flex items-center gap-1.5">
                SmartPOS{" "}
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {t("sidebar.appSubtitle", "Comptoir & Stock")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isPos) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isSidebarCollapsed ? `${item.label} (F1)` : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all mb-2.5 ${
                  isSidebarCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                    : "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/20 text-inherit font-mono shadow-sm">
                      F1
                    </span>
                  </>
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isSidebarCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isSidebarCollapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-primary/10 text-primary font-bold border-s-4 border-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              {!isSidebarCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div
        className={`p-3 border-t border-border text-[11px] text-muted-foreground flex items-center ${
          isSidebarCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!isSidebarCollapsed ? (
          <>
            <span>v1.0.0 Desktop</span>
            <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              Prisma / MySQL
            </span>
          </>
        ) : (
          <span
            className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"
            title={t("sidebar.dbConnected", "Prisma / MySQL Connecté")}
          ></span>
        )}
      </div>
    </aside>
  );
}
