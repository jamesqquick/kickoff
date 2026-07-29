import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Props {
  placeholder: string;
  /** URL search param name. Defaults to "q". */
  paramName?: string;
  className?: string;
}

/**
 * URL-state convention for search + filter pages:
 *   ?q=<search>   — owned by SearchBar (this component)
 *   ?status=<tab> — owned by TournamentStatusTabs (or equivalent)
 *   ?page=<n>     — owned by pagination links
 *
 * All params compose: changing one preserves the others.
 * Pagination resets to page 1 when the query changes.
 *
 * SearchBar uses window.location.replace() (not pushState) so the browser
 * back button takes the user to their previous page, not each intermediate
 * keystroke state.
 */
export function SearchBar({ placeholder, paramName = "q", className }: Props) {
  const initialValue =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get(paramName) ?? "")
      : "";

  const [value, setValue] = useState(initialValue);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the user has actually typed since mount. Without this guard
  // the effect fires on the initial render and triggers a replace() back to
  // the same URL, causing an infinite reload when ?q= is already in the URL.
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const url = new URL(window.location.href);
      if (value) {
        url.searchParams.set(paramName, value);
      } else {
        url.searchParams.delete(paramName);
      }
      // Reset pagination when search changes.
      url.searchParams.delete("page");
      window.location.replace(url.toString());
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-muted-fg) pointer-events-none" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
