"use client";

import React from "react";
import { motion } from "framer-motion";
import { LogoLoader } from "./logo-loader";
import { fadeVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

export interface PageLoaderProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

export function PageLoader({
  message = "Chargement de la page...",
  subMessage,
  className,
}: PageLoaderProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "min-h-[420px] w-full flex flex-col items-center justify-center p-8",
        className,
      )}
    >
      <LogoLoader size="md" message={message} subMessage={subMessage} />
    </motion.div>
  );
}
