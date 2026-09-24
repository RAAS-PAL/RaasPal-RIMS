"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { cx } from "@/lib/format";

/**
 * Search and narrow the parts list.
 *
 * <p>Every control here maps to a query the backend actually supports — `q`,
 * `category`, `lowStock`. The version this replaces offered filters for site,
 * reservations and demo units, none of which a part record has; they looked like
 * they worked and silently returned everything.
 */
export function PartsFilters({
  categories,
  resultCount,
}: {
  /** Distinct categories in use, from the database. */
  categories: string[];
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const firstRender = useRef(true);

  function commit(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const search = next.toString();
    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    });
  }

  // Debounced so a search does not fire a round trip per keystroke.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      if ((params.get("q") ?? "") !== query) commit({ q: query });
    }, 220);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const category = params.get("category") ?? "";
  const lowStock = params.get("lowStock") === "true";
  const filtered = Boolean(query || category || lowStock);

  return (
    <div className="mb-5 rounded-lg bg-surface shadow-[var(--shadow-card)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-52">
          <Search
            size={15}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, SKU or part number"
            aria-label="Search parts by name, SKU or part number"
            className={cx(
              "h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-sm",
              "placeholder:text-faint transition-colors duration-150",
              "hover:border-[var(--fg-subtle)] focus:border-[var(--focus)]",
            )}
          />
        </div>

        {/* Hidden entirely when nothing is categorised yet, rather than offering a
            select with one empty option in it. */}
        {categories.length > 0 ? (
          <Select
            value={category}
            onChange={(event) => commit({ category: event.target.value })}
            aria-label="Filter by category"
            className="w-auto min-w-40"
          >
            <option value="">All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        ) : null}

        <Button
          variant={lowStock ? "primary" : "secondary"}
          size="sm"
          aria-pressed={lowStock}
          onClick={() => commit({ lowStock: lowStock ? "" : "true" })}
        >
          Needs restocking
        </Button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <p aria-live="polite" className="text-[0.75rem] text-muted">
          <span className="font-mono font-semibold tabular-nums text-fg">{resultCount}</span>{" "}
          {resultCount === 1 ? "part" : "parts"}
          {lowStock ? " · at or below the reorder point" : ""}
        </p>
        {filtered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              commit({ q: "", category: "", lowStock: "" });
            }}
          >
            <X size={14} aria-hidden />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
