import Link from "next/link";

import { cx } from "@/lib/format";

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today in Bangkok, whatever timezone the server runs in. */
function bangkokToday(): Date {
  const [y, m, d] = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function presets() {
  const t = bangkokToday();
  const minus = (days: number) => new Date(t.getFullYear(), t.getMonth(), t.getDate() - days);
  return [
    { label: "7 days", from: iso(minus(6)), to: iso(t) },
    { label: "30 days", from: iso(minus(29)), to: iso(t) },
    { label: "This month", from: iso(new Date(t.getFullYear(), t.getMonth(), 1)), to: iso(t) },
    { label: "Last month", from: iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), to: iso(new Date(t.getFullYear(), t.getMonth(), 0)) },
    { label: "3 months", from: iso(new Date(t.getFullYear(), t.getMonth() - 2, 1)), to: iso(t) },
    { label: "12 months", from: iso(new Date(t.getFullYear(), t.getMonth() - 11, 1)), to: iso(t) },
  ];
}

/**
 * The dashboard's period: quick ranges as links, and a from/to form for anything else. It
 * is a plain GET form, so the period sits in the URL and a link to it shows the same view.
 */
export function MkPeriod({ basePath, from, to }: { basePath: string; from: string; to: string }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <nav aria-label="Quick periods" className="flex flex-wrap gap-1 rounded-lg bg-surface p-1 shadow-[var(--shadow-card)]">
        {presets().map((p) => {
          const active = p.from === from && p.to === to;
          return (
            <Link
              key={p.label}
              href={`${basePath}?from=${p.from}&to=${p.to}`}
              className={cx(
                "rounded-md px-2.5 py-1 text-[0.75rem] font-medium transition-colors",
                active ? "bg-brand-solid text-[var(--brand-on-solid)]" : "text-muted hover:bg-inset hover:text-fg",
              )}
            >
              {p.label}
            </Link>
          );
        })}
      </nav>
      <form action={basePath} method="get" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-faint">
          From
          <input type="date" name="from" defaultValue={from} required
            className="h-8 rounded-md border border-line bg-surface px-2 text-[0.8125rem] normal-case tracking-normal text-fg" />
        </label>
        <label className="flex flex-col gap-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-faint">
          To
          <input type="date" name="to" defaultValue={to} required
            className="h-8 rounded-md border border-line bg-surface px-2 text-[0.8125rem] normal-case tracking-normal text-fg" />
        </label>
        <button type="submit" className="h-8 rounded-md border border-line bg-surface px-3 text-[0.8125rem] font-medium hover:bg-inset">
          Show
        </button>
      </form>
    </div>
  );
}
