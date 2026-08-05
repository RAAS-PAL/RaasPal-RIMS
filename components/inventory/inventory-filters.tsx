"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { CATEGORY_META, CATEGORY_ORDER, WAREHOUSES } from "@/lib/catalog";
import { cx } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";

const VIEWS = [
  { value: "", label: "All robots" },
  { value: "attention", label: "Needs attention" },
  { value: "demo", label: "Has demo units" },
  { value: "reserved", label: "Has reservations" },
] as const;

export function InventoryFilters({ resultCount }: { resultCount: number }) {
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

  const site = params.get("site") ?? "";
  const view = params.get("view") ?? "";
  const category = params.get("category") ?? "";
  const filtered = Boolean(query || site || view || category);

  return (
    <div className="mb-5 rounded-lg border border-line bg-surface p-3">
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
            placeholder="Filter by name or model ID"
            aria-label="Filter inventory by name or model ID"
            className={cx(
              "h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-sm",
              "placeholder:text-faint transition-colors duration-150",
              "hover:border-[var(--fg-subtle)] focus:border-[var(--focus)]",
            )}
          />
        </div>

        <Select
          value={site}
          onChange={(event) => commit({ site: event.target.value })}
          aria-label="Filter by site"
          className="w-auto min-w-44"
        >
          <option value="">All sites, rolled up</option>
          {WAREHOUSES.map((warehouse) => (
            <option key={warehouse.code} value={warehouse.code}>
              {warehouse.code} · {warehouse.city}
            </option>
          ))}
        </Select>

        <Select
          value={category}
          onChange={(event) => commit({ category: event.target.value })}
          aria-label="Filter by category"
          className="w-auto min-w-36"
        >
          <option value="">All categories</option>
          {CATEGORY_ORDER.map((id) => (
            <option key={id} value={id}>
              {CATEGORY_META[id].label}
            </option>
          ))}
        </Select>

        <Select
          value={view}
          onChange={(event) => commit({ view: event.target.value })}
          aria-label="Filter by stock condition"
          className="w-auto min-w-40"
        >
          {VIEWS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <p aria-live="polite" className="text-[0.75rem] text-muted">
          <span className="font-mono font-semibold tabular-nums text-fg">
            {resultCount}
          </span>{" "}
          {resultCount === 1 ? "robot" : "robots"}
          {site ? ` · counts shown for ${site}` : " · counts rolled up across all sites"}
        </p>
        {filtered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              commit({ q: "", site: "", view: "", category: "" });
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
