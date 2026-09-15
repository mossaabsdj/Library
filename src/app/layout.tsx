import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/contexts/I18nContext";
import { PosProvider } from "@/features/pos/posState";
import { ThemeProvider } from "@/contexts/ThemeContext";

import { LoadingProvider } from "@/contexts/LoadingContext";
import { SplashScreen } from "@/components/SplashScreen";

export const metadata: Metadata = {
  title: "SmartPOS - Stock Management & Counter Sales",
  description:
    "High-performance Desktop Stock Management & Counter POS Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <ThemeProvider>
          <LoadingProvider>
            <I18nProvider>
              <SplashScreen />
              <PosProvider>{children}</PosProvider>
            </I18nProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
