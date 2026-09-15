"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeColor = "blue" | "emerald" | "indigo" | "purple";

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggleDarkMode: () => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isGlobalProductModalOpen: boolean;
  openGlobalProductModal: () => void;
  closeGlobalProductModal: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [themeColor, setThemeColorState] = useState<ThemeColor>("blue");
  const [isSidebarCollapsed, setSidebarCollapsedState] =
    useState<boolean>(false);
  const [isGlobalProductModalOpen, setIsGlobalProductModalOpen] =
    useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  const getSystemTheme = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  const applyTheme = useCallback(
    (currentMode: ThemeMode, currentColor: ThemeColor) => {
      if (typeof document === "undefined") return;
      const root = document.documentElement;

      const effectiveTheme =
        currentMode === "system" ? getSystemTheme() : currentMode;
      setResolvedTheme(effectiveTheme);

      if (effectiveTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }

      root.setAttribute("data-theme-color", currentColor);
      root.setAttribute("data-theme-mode", currentMode);
    },
    [getSystemTheme],
  );

  useEffect(() => {
    setIsMounted(true);

    const savedMode = localStorage.getItem(
      "smartpos_theme_mode",
    ) as ThemeMode | null;
    const savedColor = localStorage.getItem(
      "smartpos_theme_color",
    ) as ThemeColor | null;
    const savedSidebar = localStorage.getItem("smartpos_sidebar_collapsed");

    const initialMode: ThemeMode =
      savedMode === "dark" || savedMode === "light" || savedMode === "system"
        ? savedMode
        : "light";
    const initialColor: ThemeColor = savedColor || "blue";
    const initialSidebar = savedSidebar === "true";

    setModeState(initialMode);
    setThemeColorState(initialColor);
    setSidebarCollapsedState(initialSidebar);
    applyTheme(initialMode, initialColor);

    // Sync with database settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((s) => {
        if (s) {
          const dbMode =
            s.themeMode === "dark" ||
            s.themeMode === "light" ||
            s.themeMode === "system"
              ? (s.themeMode as ThemeMode)
              : null;
          const dbColor = s.themeColor as ThemeColor | null;

          if (dbMode && !savedMode) {
            setModeState(dbMode);
            localStorage.setItem("smartpos_theme_mode", dbMode);
          }
          if (dbColor && !savedColor) {
            setThemeColorState(dbColor);
            localStorage.setItem("smartpos_theme_color", dbColor);
          }
          applyTheme(
            savedMode || dbMode || initialMode,
            savedColor || dbColor || initialColor,
          );
        }
      })
      .catch(() => {});
  }, [applyTheme]);

  // Listen to OS system theme changes if mode === "system"
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (mode === "system") {
        applyTheme("system", themeColor);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode, themeColor, applyTheme]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("smartpos_theme_mode", newMode);
    applyTheme(newMode, themeColor);

    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeMode: newMode }),
    }).catch(() => {});
  };

  const toggleDarkMode = () => {
    const nextMode = resolvedTheme === "light" ? "dark" : "light";
    setMode(nextMode);
  };

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem("smartpos_theme_color", color);
    applyTheme(mode, color);

    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeColor: color }),
    }).catch(() => {});
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem("smartpos_sidebar_collapsed", String(collapsed));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const openGlobalProductModal = () => setIsGlobalProductModalOpen(true);
  const closeGlobalProductModal = () => setIsGlobalProductModalOpen(false);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedTheme,
        setMode,
        toggleDarkMode,
        themeColor,
        setThemeColor,
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        isGlobalProductModalOpen,
        openGlobalProductModal,
        closeGlobalProductModal,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
