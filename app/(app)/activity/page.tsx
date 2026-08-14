import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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
import { MOVEMENT_LABELS, type StockMovementResponse } from "@/lib/backend-types";
import { cx, day, num, stamp } from "@/lib/format";
import { listRecentMovements } from "@/lib/stock-data";

export const metadata: Metadata = { title: "Activity log" };

const PAGE_SIZE = 40;

/**
 * The stock ledger — every movement of every part, newest first.
 *
 * <p>This page used to render a fabricated audit trail: price changes, reservations,
 * media edits and demo transfers, none of which any table records. It now shows the
 * one trail that is real, `stock_movements`, and nothing else.
 *
 * <p>Robots are absent by design. `robot_inventory_temp` keeps one step back — the
 * previous count and when it changed — and no history beyond that, so there is nothing
 * honest to list here for them.
 */
export default async function ActivityPage(props: PageProps<"/activity">) {
  await requireUser();
  const params = await props.searchParams;

  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  const requested = Math.max(1, Number.parseInt(raw ?? "", 10) || 1);

  // The backend pages from zero; the URL counts from one, because a "page 0" link
  // in someone's history is a support question waiting to happen.
  const feed = await listRecentMovements({ page: requested - 1, size: PAGE_SIZE });
  const pages = Math.max(1, feed.totalPages);
  const current = Math.min(requested, pages);

  /* Grouped by day so a reader can see a shift's worth of work at once. */
  const byDay = new Map<string, StockMovementResponse[]>();
  for (const movement of feed.content) {
    const key = movement.createdAt.slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), movement]);
  }

  const href = (page: number) => (page <= 1 ? "/activity" : `/activity?page=${page}`);

  return (
    <>
      <PageHeader
        eyebrow="Audit"
        title="Activity log"
        description="Every movement of stock in and out, in order. Entries are written when a count changes and can never be edited — a mistake is corrected by recording the opposite."
        trail={[{ label: "Dashboard", href: "/" }, { label: "Activity log" }]}
      />

      <Panel>
        <PanelHeader>
          <PanelTitle
            eyebrow={`${num(feed.totalElements)} ${
              feed.totalElements === 1 ? "movement" : "movements"
            }`}
            icon={<History size={16} aria-hidden />}
          >
            Stock movements
          </PanelTitle>
          {pages > 1 ? (
            <Chip tone="neutral">
              Page {current} of {pages}
            </Chip>
          ) : null}
        </PanelHeader>

        {feed.content.length === 0 ? (
          <EmptyState icon={<History size={26} aria-hidden />} title="Nothing recorded yet">
            Stock movements appear here as parts are received, issued and corrected.
          </EmptyState>
        ) : (
          <div>
            {[...byDay.entries()].map(([date, group]) => (
              <section key={date}>
                <h2 className="sticky top-14 z-10 border-y border-line bg-subtle px-4 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted sm:px-5">
                  {day(`${date}T00:00:00.000Z`)}
                </h2>
                <PanelFlush>
                  <ul className="divide-y divide-[var(--line)]">
                    {group.map((movement) => (
                      <MovementRow key={movement.id} movement={movement} />
                    ))}
                  </ul>
                </PanelFlush>
              </section>
            ))}
          </div>
        )}

        {pages > 1 ? (
          <PanelFooter>
            <p className="text-[0.75rem] text-muted">
              Showing {(current - 1) * PAGE_SIZE + 1}–
              {Math.min(current * PAGE_SIZE, feed.totalElements)} of {num(feed.totalElements)}
            </p>
            <div className="flex items-center gap-2">
              {current > 1 ? (
                <Link
                  href={href(current - 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-line-strong bg-surface px-2.5 text-[0.8125rem] transition-colors hover:bg-inset"
                >
                  <ChevronLeft size={14} aria-hidden />
                  Newer
                </Link>
              ) : null}
              {current < pages ? (
                <Link
                  href={href(current + 1)}
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

function MovementRow({ movement }: { movement: StockMovementResponse }) {
  const incoming = movement.quantityChange >= 0;

  return (
    <li className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <span
        className={cx(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          incoming ? "bg-ok-wash text-ok-ink" : "bg-crit-wash text-crit-ink",
        )}
      >
        {incoming ? (
          <ArrowDownLeft size={15} aria-hidden />
        ) : (
          <ArrowUpRight size={15} aria-hidden />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem]">
          <span className="font-semibold">{MOVEMENT_LABELS[movement.movementType]}</span>{" "}
          <span
            className={cx(
              "font-mono font-semibold tabular-nums",
              incoming ? "text-ok-ink" : "text-crit-ink",
            )}
          >
            {incoming ? "+" : ""}
            {num(movement.quantityChange)}
          </span>{" "}
          <span className="text-muted">·</span>{" "}
          {/* A deleted part leaves its movements behind; naming it "Deleted part"
              is more honest than an empty line where a name should be. */}
          <span className="font-medium">{movement.itemName ?? "Deleted part"}</span>
        </p>
        {movement.note ? (
          <p className="mt-0.5 text-[0.75rem] leading-relaxed text-muted">{movement.note}</p>
        ) : null}
        <p className="mt-0.5 font-mono text-[0.6875rem] text-faint">
          {movement.itemSku ?? "—"} · balance {num(movement.balanceAfter)}
          {movement.robotSerialNumber ? ` · ${movement.robotSerialNumber}` : ""}
        </p>
      </div>

      <p className="shrink-0 text-right text-[0.6875rem] text-muted">
        {stamp(movement.createdAt)}
        {movement.createdByName ? (
          <span className="mt-0.5 block text-faint">{movement.createdByName}</span>
        ) : null}
      </p>
    </li>
  );
}
