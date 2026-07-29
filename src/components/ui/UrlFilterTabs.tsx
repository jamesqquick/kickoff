import { useState } from "react";
import { FilterTabs } from "@/components/ui/FilterTabs";
import type { FilterTab } from "@/components/ui/FilterTabs";

interface Props<T extends string> {
  tabs: FilterTab<T>[];
  /**
   * The tab value that represents "no filter". Selecting it removes the URL
   * param entirely rather than setting it (e.g. "all" → ?status= disappears).
   */
  defaultTab: T;
  /**
   * URL search param to manage. Defaults to "status".
   * Each UrlFilterTabs instance on a page must own a distinct param.
   */
  paramName?: string;
  /**
   * Server-provided initial value. Pass the parsed URL param from your Astro
   * page so the server renders the correct tab without a hydration flash.
   * Falls back to defaultTab if omitted.
   */
  initialTab?: T;
  /** Count to display on each tab badge. */
  counts: Record<T, number>;
}

/**
 * Generic tab bar that owns a single URL search param and triggers a full
 * server-side navigation on change.
 *
 * URL-state convention (same as SearchBar):
 *   - Tab changes call window.location.replace() so the back button returns
 *     to the pre-filter page, not each intermediate tab state.
 *   - All other URL params are preserved when the tab changes.
 *   - ?page= is always reset to avoid landing on a stale page offset.
 *
 * Usage in an Astro page:
 *   const status = Astro.url.searchParams.get("status") ?? undefined;
 *   const activeTab = VALID_TABS.includes(status) ? status : "all";
 *   <UrlFilterTabs tabs={TABS} defaultTab="all" initialTab={activeTab} counts={counts} client:load />
 *
 * Domain-specific wrappers (e.g. TournamentStatusTabs) should compose this
 * component rather than re-implementing the navigation logic.
 */
export function UrlFilterTabs<T extends string>({
  tabs,
  defaultTab,
  paramName = "status",
  initialTab,
  counts,
}: Props<T>) {
  const [activeTab, setActiveTab] = useState<T>(initialTab ?? defaultTab);

  function handleTabChange(tab: T) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === defaultTab) {
      url.searchParams.delete(paramName);
    } else {
      url.searchParams.set(paramName, tab);
    }
    // Reset pagination when the filter changes.
    url.searchParams.delete("page");
    window.location.replace(url.toString());
  }

  return (
    <FilterTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      countFor={(value) => counts[value]}
    />
  );
}
