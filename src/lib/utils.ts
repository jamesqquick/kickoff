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

export const COLOR_GRADIENTS: Record<string, string> = {
  emerald: "from-emerald-500 to-emerald-700",
  violet:  "from-violet-600 to-violet-900",
  red:     "from-red-500 to-red-800",
  sky:     "from-sky-500 to-blue-700",
  amber:   "from-amber-400 to-amber-600",
  rose:    "from-rose-500 to-pink-700",
  teal:    "from-teal-500 to-cyan-700",
  slate:   "from-slate-500 to-slate-800",
};

/**
 * Maps a stored team color key (e.g. "violet") to its Tailwind gradient classes.
 * Falls back to emerald if the key is unrecognised or absent.
 */
export function teamColorGradient(color: string | null | undefined): string {
  return COLOR_GRADIENTS[color ?? ""] ?? COLOR_GRADIENTS.emerald;
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
