"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ProductModal } from "@/features/products/ProductModal";
import { useTheme } from "@/contexts/ThemeContext";

export function AppLayout({
  children,
  title,
  showSidebar = true,
}: {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}) {
  const { isGlobalProductModalOpen, closeGlobalProductModal } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
          {children}
        </main>
      </div>

      {/* Global Product Modal triggered from Header "+ Produit" button anywhere */}
      <ProductModal
        open={isGlobalProductModalOpen}
        onOpenChange={(open) => {
          if (!open) closeGlobalProductModal();
        }}
        onSuccess={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("product-created"));
          }
        }}
      />
    </div>
  );
}
