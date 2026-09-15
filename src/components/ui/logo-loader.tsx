"use client";

import React from "react";
import { motion } from "framer-motion";
import { Store, ShoppingCart } from "lucide-react";
import {
  logoFloatAnimation,
  logoFloatTransition,
  logoShadowAnimation,
  logoShadowTransition,
  logoGlowAnimation,
  logoGlowTransition,
} from "@/lib/animations";
import { cn } from "@/lib/utils";

export interface LogoLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  subMessage?: string;
  className?: string;
  inline?: boolean;
}

export function LogoLoader({
  size = "md",
  message,
  subMessage,
  className,
  inline = false,
}: LogoLoaderProps) {
  const sizeConfig = {
    sm: {
      container: "h-8 w-8 rounded-lg",
      icon: "h-4 w-4",
      glow: "h-12 w-12",
      shadow: "h-1 w-6",
      text: "text-xs",
      subtext: "text-[10px]",
    },
    md: {
      container: "h-12 w-12 rounded-xl",
      icon: "h-6 w-6",
      glow: "h-16 w-16",
      shadow: "h-1.5 w-10",
      text: "text-xs",
      subtext: "text-[11px]",
    },
    lg: {
      container: "h-16 w-16 rounded-2xl",
      icon: "h-8 w-8",
      glow: "h-24 w-24",
      shadow: "h-2 w-14",
      text: "text-sm",
      subtext: "text-xs",
    },
    xl: {
      container: "h-20 w-20 rounded-2xl",
      icon: "h-10 w-10",
      glow: "h-28 w-28",
      shadow: "h-2.5 w-18",
      text: "text-base",
      subtext: "text-xs",
    },
  }[size];

  if (inline) {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <motion.div
          animate={logoFloatAnimation}
          transition={logoFloatTransition}
          className={cn(
            "flex items-center justify-center bg-primary text-primary-foreground shadow-md shadow-primary/25",
            sizeConfig.container,
          )}
        >
          <Store className={sizeConfig.icon} />
        </motion.div>
        {message && (
          <span className={cn("font-medium text-foreground", sizeConfig.text)}>
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center select-none text-center",
        className,
      )}
    >
      {/* Floating Logo with Soft Aura and Shadow */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Subtle Ambient Aura */}
        <motion.div
          animate={logoGlowAnimation}
          transition={logoGlowTransition}
          className={cn(
            "absolute rounded-full bg-primary/20 blur-xl pointer-events-none",
            sizeConfig.glow,
          )}
        />

        {/* Floating Logo Badge */}
        <motion.div
          animate={logoFloatAnimation}
          transition={logoFloatTransition}
          className={cn(
            "relative z-10 flex items-center justify-center bg-primary text-primary-foreground shadow-xl shadow-primary/25 border border-primary/30",
            sizeConfig.container,
          )}
        >
          <Store className={sizeConfig.icon} />
        </motion.div>

        {/* Soft Dynamic Shadow (contracts as logo rises) */}
        <motion.div
          animate={logoShadowAnimation}
          transition={logoShadowTransition}
          className={cn(
            "mt-2.5 rounded-full bg-foreground/15 blur-[2px]",
            sizeConfig.shadow,
          )}
        />
      </div>

      {/* Message and Sub-message */}
      {(message || subMessage) && (
        <div className="mt-3 space-y-0.5">
          {message && (
            <p
              className={cn(
                "font-bold text-foreground tracking-tight",
                sizeConfig.text,
              )}
            >
              {message}
            </p>
          )}
          {subMessage && (
            <p className={cn("text-muted-foreground", sizeConfig.subtext)}>
              {subMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
