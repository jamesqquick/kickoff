import { useState } from "react";
import { cn } from "@/lib/utils";
import { FilterTabs } from "@/components/ui/FilterTabs";
import type { FilterTab } from "@/components/ui/FilterTabs";
import type { RegistrationWithDetails } from "@/repositories/tournament-registration-repository";
import type { RegistrationStatus } from "@/lib/schema";
import { REGISTRATION_STATUS_COLORS } from "@/lib/registration-display";

interface Props {
  initialRegistrations: RegistrationWithDetails[];
  tournamentId: string;
  hasFee: boolean;
}

type StatusFilter = "all" | RegistrationStatus;

const TABS: FilterTab<StatusFilter>[] = [
  { label: "Pending",    value: "pending"    },
  { label: "All",        value: "all"        },
  { label: "Approved",   value: "approved"   },
  { label: "Waitlisted", value: "waitlisted" },
  { label: "Rejected",   value: "rejected"   },
];

function formatPaidDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RegistrationReviewTable({ initialRegistrations, tournamentId, hasFee }: Props) {
  const [activeTab, setActiveTab] = useState<StatusFilter>("pending");

  const filtered =
    activeTab === "all"
      ? initialRegistrations
      : initialRegistrations.filter((r) => r.status === activeTab);

  function countFor(v: StatusFilter) {
    return v === "all"
      ? initialRegistrations.length
      : initialRegistrations.filter((r) => r.status === v).length;
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
        <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-card)">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--color-border)">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">Team</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">Division</th>
                <th className="hidden sm:table-cell text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">Registered</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">Status</th>
                {hasFee && (
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-(--color-muted-fg) px-5 py-3">Payment</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => {
                    window.location.href = `/director/tournaments/${tournamentId}/registrations/${r.id}`;
                  }}
                  className="border-b border-(--color-border-soft) last:border-0 hover:bg-(--color-background) transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-medium text-(--color-foreground)">{r.teamName}</td>
                  <td className="px-5 py-3.5 text-(--color-muted)">{r.divisionName}</td>
                  <td className="hidden sm:table-cell px-5 py-3.5 text-(--color-muted)">
                    {new Date(r.registeredAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", REGISTRATION_STATUS_COLORS[r.status])}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  {hasFee && (
                    <td className="px-5 py-3.5">
                      {r.paidAt ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Paid {formatPaidDate(r.paidAt)}
                        </span>
                      ) : (
                        <span className="text-xs text-(--color-muted)">Unpaid</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
