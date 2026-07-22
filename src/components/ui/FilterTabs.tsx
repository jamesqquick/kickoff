import { cn } from "@/lib/utils";

export interface FilterTab<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  tabs: FilterTab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  countFor: (value: T) => number;
}

export function FilterTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  countFor,
}: Props<T>) {
  return (
    <div className="mb-4 flex gap-1 border-b border-(--color-border) overflow-x-auto scrollbar-none">
      {tabs.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onTabChange(value)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
            activeTab === value
              ? "border-b-2 border-(--color-primary) text-(--color-foreground)"
              : "text-(--color-muted) hover:text-(--color-foreground)",
          )}
        >
          {label}
          <span
            className={cn(
              "ml-1.5 rounded-full px-1.5 py-0.5 text-xs",
              activeTab === value
                ? "bg-(--color-primary) text-white"
                : "bg-(--color-muted-bg) text-(--color-muted)",
            )}
          >
            {countFor(value)}
          </span>
        </button>
      ))}
    </div>
  );
}
