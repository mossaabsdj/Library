import { Variants, Transition } from "framer-motion";

/**
 * Reusable Framer Motion Variants & Transitions for SmartPOS
 * Professional, elegant, subtle, and high-performance.
 */

// Splash & Loader Logo Entrance / Exit
export const logoEntranceVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.85,
    y: 30,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 1.04,
    y: -10,
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
};

// Subtle continuous floating motion (as requested: y: [0, -8, 0])
export const logoFloatAnimation = {
  y: [0, -8, 0],
};

export const logoFloatTransition: Transition = {
  repeat: Infinity,
  duration: 3.2,
  ease: "easeInOut",
};

// Logo Shadow Expansion (inversely tracks height)
export const logoShadowAnimation = {
  scale: [1, 0.85, 1],
  opacity: [0.4, 0.2, 0.4],
};

export const logoShadowTransition: Transition = {
  repeat: Infinity,
  duration: 3.2,
  ease: "easeInOut",
};

// Subtle Aura Glow Pulse
export const logoGlowAnimation = {
  scale: [0.95, 1.1, 0.95],
  opacity: [0.35, 0.6, 0.35],
};

export const logoGlowTransition: Transition = {
  repeat: Infinity,
  duration: 2.8,
  ease: "easeInOut",
};

// Universal Fade Variants
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

// Universal Scale Variants (Modals, Popovers, Dialogs)
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15, ease: "easeInOut" },
  },
};

// Page Transition Variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};
