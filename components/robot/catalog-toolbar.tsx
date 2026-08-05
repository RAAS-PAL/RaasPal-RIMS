"use client";

import { LayoutGrid, Loader2, Rows3, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/catalog";
import { cx } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";

export const SORTS = [
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name A–Z" },
  { value: "stock-low", label: "Lowest stock first" },
  { value: "stock-high", label: "Highest stock first" },
  { value: "price-high", label: "Price, high to low" },
  { value: "price-low", label: "Price, low to high" },
] as const;

export const STOCK_FILTERS = [
  { value: "", label: "Any stock level" },
  { value: "in-stock", label: "In stock" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
  { value: "attention", label: "Needs attention" },
  { value: "demo", label: "Has demo units" },
] as const;

/**
 * Filters live in the URL so a filtered view can be sent to a colleague or
 * kept open in a tab, and the back button restores what you were looking at.
 */
export function CatalogToolbar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
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

  /* Typing filters the list without a request per keystroke. */
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
  const stock = params.get("stock") ?? "";
  const sort = params.get("sort") ?? "updated";
  const view = params.get("view") === "table" ? "table" : "grid";
  const filtered = Boolean(query || category || stock || sort !== "updated");

  return (
    <div className="mb-5 rounded-lg border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-56">
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
            aria-label="Filter robots by name or model ID"
            className={cx(
              "h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-9 text-sm",
              "placeholder:text-faint transition-colors duration-150",
              "hover:border-[var(--fg-subtle)] focus:border-[var(--focus)]",
            )}
          />
          {pending ? (
            <Loader2
              size={14}
              aria-hidden
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-faint"
            />
          ) : null}
        </div>

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
          value={stock}
          onChange={(event) => commit({ stock: event.target.value })}
          aria-label="Filter by stock level"
          className="w-auto min-w-36"
        >
          {STOCK_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={sort}
          onChange={(event) => commit({ sort: event.target.value })}
          aria-label="Sort robots"
          className="w-auto min-w-40"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <div
          role="radiogroup"
          aria-label="Layout"
          className="flex items-center gap-0.5 rounded-md border border-line bg-inset p-0.5"
        >
          {[
            { value: "grid", label: "Cards", icon: LayoutGrid },
            { value: "table", label: "Table", icon: Rows3 },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={view === value}
              aria-label={label}
              title={label}
              onClick={() => commit({ view: value === "grid" ? "" : value })}
              className={cx(
                "flex size-7 cursor-pointer items-center justify-center rounded transition-colors duration-150",
                view === value
                  ? "bg-surface text-fg shadow-[0_1px_2px_rgb(11_22_34/0.12)]"
                  : "text-faint hover:text-fg",
              )}
            >
              <Icon size={14} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <p aria-live="polite" className="text-[0.75rem] text-muted">
          <span className="font-mono font-semibold tabular-nums text-fg">
            {resultCount}
          </span>{" "}
          {resultCount === 1 ? "robot" : "robots"}
          {filtered ? " match these filters" : " in the catalogue"}
        </p>
        {filtered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              commit({ q: "", category: "", stock: "", sort: "" });
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
