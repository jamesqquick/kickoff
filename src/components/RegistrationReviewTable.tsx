import { useState } from "react";
import { cn } from "@/lib/utils";
import { FilterTabs } from "@/components/ui/FilterTabs";
import type { FilterTab } from "@/components/ui/FilterTabs";
import { RegistrationStatusButton } from "@/components/RegistrationStatusButton";
import type { RegistrationWithDetails } from "@/repositories/tournament-registration-repository";
import type { RegistrationStatus } from "@/lib/schema";

const STATUS_COLORS: Record<RegistrationStatus, string> = {
  pending:    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  approved:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  waitlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  rejected:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

interface Props {
  initialRegistrations: RegistrationWithDetails[];
}

type StatusFilter = "all" | RegistrationStatus;

const TABS: FilterTab<StatusFilter>[] = [
  { label: "Pending",    value: "pending"    },
  { label: "All",        value: "all"        },
  { label: "Approved",   value: "approved"   },
  { label: "Waitlisted", value: "waitlisted" },
  { label: "Rejected",   value: "rejected"   },
];

export function RegistrationReviewTable({ initialRegistrations }: Props) {
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>(initialRegistrations);
  const [activeTab, setActiveTab] = useState<StatusFilter>("pending");

  function handleStatusChange(id: string, newStatus: RegistrationStatus) {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    );
  }

  const filtered =
    activeTab === "all"
      ? registrations
      : registrations.filter((r) => r.status === activeTab);

  function countFor(v: StatusFilter) {
    return v === "all" ? registrations.length : registrations.filter((r) => r.status === v).length;
  }

  return (
    <div>
      <FilterTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        countFor={countFor}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-(--color-muted) text-center py-8">
          No {activeTab === "all" ? "" : activeTab} registrations.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--color-border)">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-3 py-2">Team</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-3 py-2">Division</th>
                <th className="hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-3 py-2">Registered</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-3 py-2">Status</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-(--color-border-soft) last:border-0 hover:bg-(--color-background) transition-colors"
                >
                  <td className="px-3 py-3 font-medium text-(--color-foreground)">{r.teamName}</td>
                  <td className="px-3 py-3 text-(--color-muted)">{r.divisionName}</td>
                  <td className="hidden sm:table-cell px-3 py-3 text-(--color-muted)">
                    {new Date(r.registeredAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[r.status])}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <RegistrationStatusButton
                      registrationId={r.id}
                      currentStatus={r.status}
                      onSuccess={(newStatus) => handleStatusChange(r.id, newStatus)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
