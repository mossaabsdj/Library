"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoLoader } from "./logo-loader";
import { fadeVariants } from "@/lib/animations";

export interface AppLoaderProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
}

export function AppLoader({
  isLoading,
  message = "Traitement en cours...",
  subMessage,
}: AppLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          variants={fadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-xl select-none"
        >
          {/* Subtle Radial Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

          {/* Premium Center Card */}
          <div>
            <LogoLoader size="lg" message={message} subMessage={subMessage} />

            {/* Subtle Progress Dots */}
            <div className="flex items-center gap-1.5 mt-5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
