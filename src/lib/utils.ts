import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "DA",
): string {
  if (amount === null || amount === undefined) return `0.00 ${currency}`;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `0.00 ${currency}`;
  return `${num.toLocaleString("fr-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "0";
  const val = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(val)) return "0";
  return val.toLocaleString("fr-DZ");
}

export function generateInvoiceNumber(prefix = "CMD"): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomSuffix}`;
}

/**
 * Safely resolves any product image path or URL for web and desktop display.
 * Supports:
 * - Web relative paths (/uploads/products/xyz.jpg)
 * - Relative paths without leading slash (uploads/products/xyz.jpg)
 * - Legacy bare filenames (marquer.jpg -> /uploads/products/marquer.jpg)
 * - External URLs (https://example.com/img.jpg)
 * - Base64 Data URIs (data:image/...)
 */
export function getProductImageUrl(image?: string | null): string {
  if (!image || typeof image !== "string") return "";
  const trimmed = image.trim();
  if (!trimmed) return "";

  // External URLs, Base64 or Blob URLs remain as-is
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Normalize Windows backslashes to forward slashes
  const clean = trimmed.replace(/\\/g, "/");

  // Already an absolute web path starting with slash
  if (clean.startsWith("/")) {
    return clean;
  }

  // Path starting with uploads/
  if (clean.startsWith("uploads/")) {
    return `/${clean}`;
  }

  // Legacy filename or path without leading slash
  return `/uploads/products/${clean}`;
}

// Play UI sound effects using Web Audio API (zero external sound file dependencies)
export function playBeep(type: "success" | "error" | "click" = "success") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      // Pleasant high double beep for barcode scan success
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "error") {
      // Low buzz for stock error / missing barcode
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // Subtle click
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    }
  } catch {
    // AudioContext failed or not supported in environment
  }
}
