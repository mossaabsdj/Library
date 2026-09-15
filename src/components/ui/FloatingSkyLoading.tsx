"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Sparkles, Cloud } from "lucide-react";

export interface FloatingSkyLoadingProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
}

export function FloatingSkyLoading({
  isLoading,
  message = "Chargement en cours...",
  subMessage,
}: FloatingSkyLoadingProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-slate-900/60 backdrop-blur-md select-none"
        >
          {/* Sky Canvas Container */}
          <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-sky-400/90 via-blue-600/85 to-indigo-700/90 dark:from-slate-900/95 dark:via-blue-950/90 dark:to-slate-950/95 border border-white/20 dark:border-blue-500/20 shadow-2xl shadow-blue-500/30 max-w-md w-full mx-4 overflow-hidden">
            {/* Drifting Clouds Background */}
            <motion.div
              initial={{ x: -120, opacity: 0.35 }}
              animate={{ x: 140, opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
              className="absolute -top-4 left-0 pointer-events-none text-white/30 dark:text-sky-300/10"
            >
              <Cloud className="h-28 w-28 fill-current" />
            </motion.div>

            <motion.div
              initial={{ x: 130, opacity: 0.25 }}
              animate={{ x: -130, opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="absolute top-12 right-0 pointer-events-none text-white/25 dark:text-blue-300/10"
            >
              <Cloud className="h-20 w-20 fill-current" />
            </motion.div>

            <motion.div
              initial={{ x: -80, opacity: 0.2 }}
              animate={{ x: 100, opacity: [0.2, 0.45, 0.2] }}
              transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
              className="absolute bottom-6 left-4 pointer-events-none text-white/20 dark:text-sky-200/10"
            >
              <Cloud className="h-16 w-16 fill-current" />
            </motion.div>

            {/* Twinkling Stars / Sparkles */}
            <motion.div
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute top-6 left-10 text-yellow-200/80 pointer-events-none"
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
            <motion.div
              animate={{ scale: [1.1, 0.7, 1.1], opacity: [0.3, 0.9, 0.3] }}
              transition={{
                repeat: Infinity,
                duration: 2.4,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute bottom-16 right-10 text-yellow-200/80 pointer-events-none"
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>

            {/* Floating Logo Area */}
            <div className="relative flex flex-col items-center justify-center my-6">
              {/* Outer Glowing Orbital Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
                className="absolute h-36 w-36 rounded-full border border-dashed border-white/40 dark:border-blue-400/40 pointer-events-none"
              />

              {/* Pulsing Aura */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: "easeInOut",
                }}
                className="absolute h-28 w-28 rounded-full bg-white/20 dark:bg-blue-500/20 blur-xl pointer-events-none"
              />

              {/* THE FLOATING LOGO (Smooth motion hovering in the sky) */}
              <motion.div
                animate={{
                  y: [-12, 12, -12],
                  rotate: [-3, 3, -3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.6,
                  ease: "easeInOut",
                }}
                className="relative z-10 flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-tr from-white via-blue-50 to-white text-blue-600 shadow-xl shadow-blue-900/30 border-2 border-white/80"
              >
                <div className="relative flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 text-blue-600 drop-shadow" />
                  <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
                </div>
              </motion.div>

              {/* Floating Shadow Under Logo (expands & contracts with height) */}
              <motion.div
                animate={{
                  scale: [0.65, 1.15, 0.65],
                  opacity: [0.25, 0.55, 0.25],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.6,
                  ease: "easeInOut",
                }}
                className="mt-4 h-3 w-16 rounded-full bg-slate-900/40 dark:bg-black/60 blur-[3px]"
              />
            </div>

            {/* Application Title & Loading State */}
            <div className="relative z-10 text-center space-y-1.5 mt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-blue-500/20 backdrop-blur text-white text-[11px] font-bold tracking-wider uppercase border border-white/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                SmartPOS Cloud
              </div>
              <h3 className="text-base font-black text-white tracking-wide drop-shadow-sm">
                {message}
              </h3>
              {subMessage && (
                <p className="text-xs text-blue-100/80 dark:text-slate-300">
                  {subMessage}
                </p>
              )}
            </div>

            {/* Animated Bottom Dots Progress */}
            <div className="relative z-10 flex items-center justify-center gap-1.5 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  className="h-2 w-2 rounded-full bg-white"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
