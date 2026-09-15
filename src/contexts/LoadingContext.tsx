"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AppLoader } from "@/components/ui/app-loader";

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  subMessage?: string;
  showLoading: (message?: string, subMessage?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(
    action: () => Promise<T>,
    message?: string,
    subMessage?: string,
  ) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Traitement en cours...");
  const [subMessage, setSubMessage] = useState<string | undefined>(undefined);

  const showLoading = useCallback(
    (msg = "Traitement en cours...", sub?: string) => {
      setMessage(msg);
      setSubMessage(sub);
      setIsLoading(true);
    },
    [],
  );

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(
    async <T,>(
      action: () => Promise<T>,
      msg = "Traitement en cours...",
      sub?: string,
    ): Promise<T> => {
      showLoading(msg, sub);
      try {
        const result = await action();
        return result;
      } finally {
        setTimeout(() => {
          hideLoading();
        }, 250);
      }
    },
    [showLoading, hideLoading],
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        message,
        subMessage,
        showLoading,
        hideLoading,
        withLoading,
      }}
    >
      {children}
      <AppLoader
        isLoading={isLoading}
        message={message}
        subMessage={subMessage}
      />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
