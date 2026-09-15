"use client";

import { useEffect } from "react";

/**
 * Modern startup notifier:
 * Splash screen is now handled natively by Electron (electron/splash.html & electron/main.js).
 * This component simply notifies Electron when the React / Next.js frontend has mounted
 * so Electron can smoothly dismiss the native splash screen.
 */
export function SplashScreen() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.appReady
    ) {
      (window as any).electronAPI.appReady();
    }
  }, []);

  return null;
}
