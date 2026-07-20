import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves after `ms` milliseconds. Used to simulate async backend work in UI
 * islands until real Astro Actions are wired up.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Maps a team status value to the corresponding badge variant.
 * Single source of truth — import this wherever a team status badge is rendered.
 */
export function teamStatusVariant(
  status: import("@/lib/schema").TeamStatus,
): "warning" | "success" | "destructive" {
  if (status === "approved") return "success";
  if (status === "rejected") return "destructive";
  return "warning";
}
