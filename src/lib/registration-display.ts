import type { RegistrationStatus } from "@/lib/schema";

/**
 * Canonical pill colors for a registration status. Single source of truth —
 * shared by the coach list/detail pages, the director review table, the
 * detail actions island, and the dashboard. Includes dark-mode variants.
 */
export const REGISTRATION_STATUS_COLORS: Record<RegistrationStatus, string> = {
  pending:    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  approved:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  waitlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  rejected:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

/** Pill colors for payment state, matching the status palette. */
export const PAYMENT_STATUS_COLORS = {
  paid:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  unpaid: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
} as const;
