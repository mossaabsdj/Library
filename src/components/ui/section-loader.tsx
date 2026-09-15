"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoLoader } from "./logo-loader";
import { fadeVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

export interface SectionLoaderProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function SectionLoader({
  isLoading,
  message,
  className,
}: SectionLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          variants={fadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm rounded-2xl select-none",
            className,
          )}
        >
          <LogoLoader size="sm" message={message} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
