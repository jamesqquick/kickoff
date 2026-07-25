import { useState } from "react";
import { FilterTabs } from "@/components/ui/FilterTabs";
import type { FilterTab } from "@/components/ui/FilterTabs";

type StatusFilter = "all" | "upcoming" | "active" | "past";

const TABS: FilterTab<StatusFilter>[] = [
  { label: "All",      value: "all"      },
  { label: "Upcoming", value: "upcoming" },
  { label: "Active",   value: "active"   },
  { label: "Past",     value: "past"     },
];

interface Props {
  /** Counts per status bucket rendered by the server. */
  counts: Record<StatusFilter, number>;
  /** The active tab as determined server-side from ?status=. */
  initialTab: StatusFilter;
}

/**
 * Status tab bar for the public tournament listing.
 *
 * Tab changes trigger a full page navigation (window.location.replace) so the
 * server re-renders with the correct ?status= filter. The existing ?q= and any
 * other params are preserved — only ?status= is updated and ?page= is reset.
 */
export function TournamentStatusTabs({ counts, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<StatusFilter>(initialTab);

  function handleTabChange(tab: StatusFilter) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "all") {
      url.searchParams.delete("status");
    } else {
      url.searchParams.set("status", tab);
    }
    // Reset pagination when status changes.
    url.searchParams.delete("page");
    window.location.replace(url.toString());
  }

  return (
    <FilterTabs
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      countFor={(value) => counts[value]}
    />
  );
}
