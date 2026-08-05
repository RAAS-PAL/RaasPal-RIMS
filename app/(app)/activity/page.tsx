import { ChevronLeft, ChevronRight, History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ActivityList } from "@/components/activity/activity-list";
import { Chip } from "@/components/ui/badge";
import {
  EmptyState,
  Panel,
  PanelFlush,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { readClock } from "@/lib/clock";
import { cx, day, num } from "@/lib/format";
import { listActivity } from "@/lib/store";
import type { ActivityKind } from "@/lib/types";

export const metadata: Metadata = { title: "Activity log" };

const PAGE_SIZE = 40;

const KIND_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Everything" },
  { value: "restock", label: "Stock moves" },
  { value: "demo", label: "Demo units" },
  { value: "price", label: "Price changes" },
  { value: "reserve", label: "Reservations" },
  { value: "content", label: "Details" },
  { value: "media", label: "Media" },
];

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export default async function ActivityPage(props: PageProps<"/activity">) {
  await requireUser();
  const params = await props.searchParams;
  const kind = one(params.kind);
  const page = Math.max(1, Number.parseInt(one(params.page), 10) || 1);

  const all = await listActivity();
  const entries = kind
    ? all.filter((entry) => entry.kind === (kind as ActivityKind))
    : all;

  const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = entries.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const now = await readClock();

  /* Grouped by day so a reader can see a shift's worth of work at once. */
  const byDay = new Map<string, typeof slice>();
  for (const entry of slice) {
    const key = entry.at.slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), entry]);
  }

  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    if (changes.kind ?? kind) next.set("kind", changes.kind ?? kind);
    if (changes.page && changes.page !== "1") next.set("page", changes.page);
    const search = next.toString();
    return search ? `/activity?${search}` : "/activity";
  };

  return (
    <>
      <PageHeader
        eyebrow="Audit"
        title="Activity log"
        description="Every change to the catalogue, in order, with the person who confirmed it. Entries are written by the system and cannot be edited."
        trail={[{ label: "Dashboard", href: "/" }, { label: "Activity log" }]}
      />

      <nav aria-label="Filter by change type" className="mb-5">
        <ul className="flex flex-wrap items-center gap-1.5">
          {KIND_FILTERS.map((filter) => {
            const active = kind === filter.value;
            const count = filter.value
              ? all.filter((entry) => entry.kind === filter.value).length
              : all.length;
            return (
              <li key={filter.value || "all"}>
                <Link
                  href={href({ kind: filter.value, page: "1" })}
                  aria-current={active ? "true" : undefined}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem]",
                    "transition-colors duration-150",
                    active
                      ? "border-[var(--brand-600)] bg-brand-wash font-medium text-[var(--brand-ink)]"
                      : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {filter.label}
                  <span className="font-mono text-[0.6875rem] tabular-nums opacity-70">
                    {num(count)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Panel>
        <PanelHeader>
          <PanelTitle
            eyebrow={`${num(entries.length)} entries`}
            icon={<History size={16} aria-hidden />}
          >
            {KIND_FILTERS.find((filter) => filter.value === kind)?.label ?? "Everything"}
          </PanelTitle>
          <Chip tone="neutral">
            Page {current} of {pages}
          </Chip>
        </PanelHeader>

        {slice.length === 0 ? (
          <EmptyState title="Nothing recorded under this filter">
            Choose a different change type, or clear the filter to see the whole log.
          </EmptyState>
        ) : (
          <div>
            {[...byDay.entries()].map(([date, group]) => (
              <section key={date}>
                <h2 className="sticky top-14 z-10 border-y border-line bg-subtle px-4 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted sm:px-5">
                  {day(`${date}T00:00:00.000Z`)}
                </h2>
                <PanelFlush>
                  <ActivityList entries={group} now={now} />
                </PanelFlush>
              </section>
            ))}
          </div>
        )}

        {pages > 1 ? (
          <PanelFooter>
            <p className="text-[0.75rem] text-muted">
              Showing {(current - 1) * PAGE_SIZE + 1}–
              {Math.min(current * PAGE_SIZE, entries.length)} of {num(entries.length)}
            </p>
            <div className="flex items-center gap-2">
              {current > 1 ? (
                <Link
                  href={href({ page: String(current - 1) })}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-line-strong bg-surface px-2.5 text-[0.8125rem] transition-colors hover:bg-inset"
                >
                  <ChevronLeft size={14} aria-hidden />
                  Newer
                </Link>
              ) : null}
              {current < pages ? (
                <Link
                  href={href({ page: String(current + 1) })}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-line-strong bg-surface px-2.5 text-[0.8125rem] transition-colors hover:bg-inset"
                >
                  Older
                  <ChevronRight size={14} aria-hidden />
                </Link>
              ) : null}
            </div>
          </PanelFooter>
        ) : null}
      </Panel>
    </>
  );
}
