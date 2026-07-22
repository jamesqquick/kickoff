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

// Tournament status is derived from dates, never stored.
export type TournamentStatus = "upcoming" | "active" | "past";

/**
 * Maps a tournament status to a Tailwind pill class string.
 * Single source of truth — import wherever a tournament status pill is rendered.
 */
export function tournamentStatusClass(status: TournamentStatus): string {
  if (status === "active") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (status === "past")   return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
}

/**
 * Maps a tournament status to its display label.
 */
export function tournamentStatusLabel(status: TournamentStatus): string {
  if (status === "active")   return "Active";
  if (status === "past")     return "Past";
  return "Upcoming";
}

/**
 * Derives a tournament's status from its start/end dates relative to today.
 *   - No start date, or start date in the future → upcoming
 *   - Start date ≤ today and (no end date, or end date ≥ today) → active
 *   - End date < today → past
 */
export function getTournamentStatus(t: {
  startDate: string | null;
  endDate: string | null;
}): TournamentStatus {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (!t.startDate || t.startDate > today) return "upcoming";
  if (t.endDate && t.endDate < today) return "past";
  return "active";
}
