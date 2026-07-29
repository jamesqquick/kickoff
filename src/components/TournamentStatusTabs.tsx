import { UrlFilterTabs } from "@/components/ui/UrlFilterTabs";
import type { FilterTab } from "@/components/ui/FilterTabs";

type StatusFilter = "all" | "upcoming" | "active" | "past";

const TABS: FilterTab<StatusFilter>[] = [
  { label: "All",      value: "all"      },
  { label: "Upcoming", value: "upcoming" },
  { label: "Active",   value: "active"   },
  { label: "Past",     value: "past"     },
];

interface Props {
  counts: Record<StatusFilter, number>;
  initialTab: StatusFilter;
}

/**
 * Status tab bar for the public tournament listing.
 * Domain-specific wrapper around UrlFilterTabs — provides the tab definitions
 * and wires ?status= as the URL param.
 */
export function TournamentStatusTabs({ counts, initialTab }: Props) {
  return (
    <UrlFilterTabs
      tabs={TABS}
      defaultTab="all"
      paramName="status"
      initialTab={initialTab}
      counts={counts}
    />
  );
}
