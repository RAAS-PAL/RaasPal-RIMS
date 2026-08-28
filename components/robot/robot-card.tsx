import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import { DemoChip, StockBadge } from "@/components/ui/badge";
import { ROBOT_TYPE_LABELS, type RobotStockEntryResponse } from "@/lib/backend-types";
import { cx, num } from "@/lib/format";
import { imageUrl } from "@/lib/image-url";

import { RobotImage } from "./robot-image";

/**
 * The catalogue card.
 *
 * <p>Everything on it answers a question someone actually asks in a warehouse: what
 * is it, how many are there, where is it kept. The seed version also carried a
 * buy-off price and a per-warehouse stock meter; `robot_inventory_temp` records
 * neither a price nor a location breakdown, so both are gone rather than filled in
 * with a plausible-looking zero.
 */
export function RobotCard({
  entry,
  canWrite,
}: {
  entry: RobotStockEntryResponse;
  canWrite?: boolean;
}) {
  const demo = entry.status === "DEMO";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-150 hover:border-line-strong focus-within:border-[var(--focus)]">
      <RobotImage
        name={entry.displayName}
        robotType={entry.robotType}
        src={imageUrl("robot", entry.id, entry.hasImage)}
        className="aspect-4/3 border-b border-line"
      />

      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="eyebrow">{ROBOT_TYPE_LABELS[entry.robotType]}</p>
          {entry.version ? (
            <p className="shrink-0 font-mono text-[0.625rem] text-faint">{entry.version}</p>
          ) : null}
        </div>

        <h3 className="mt-1.5 text-[0.9375rem] font-semibold leading-tight">
          {/* The whole card is the hit target; the link keeps the accessible name. */}
          <Link href={`/robots/${entry.id}`} className="outline-none">
            <span className="absolute inset-0" aria-hidden />
            {entry.displayName}
          </Link>
        </h3>

        {entry.note ? (
          <p className="mt-1 line-clamp-1 text-[0.75rem] text-muted">{entry.note}</p>
        ) : null}

        <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-line pt-3">
          <span className="text-[0.6875rem] text-muted">
            {demo ? "Demo" : "In stock"}
          </span>
          <span className="font-mono text-[1.0625rem] font-semibold tabular-nums">
            {num(entry.quantity)}
            <span className="ml-1 font-sans text-[0.6875rem] font-normal text-muted">
              {entry.quantity === 1 ? "unit" : "units"}
            </span>
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {/* Zero first: DemoChip renders nothing at a count of 0, which would leave
              the row blank and read as missing data rather than as "none held". */}
          {entry.quantity === 0 ? (
            <StockBadge state="out-of-stock" />
          ) : demo ? (
            <DemoChip count={entry.quantity} />
          ) : (
            <StockBadge state="in-stock" count={entry.quantity} />
          )}
          {entry.location ? (
            <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted">
              <MapPin size={11} aria-hidden />
              {entry.location}
            </span>
          ) : null}
        </div>

        {/* Spelled out rather than left to "view details". Someone looking for where
            to change a count should not have to guess that the detail page is also
            the edit page. */}
        <p
          className={cx(
            "mt-3 flex items-center gap-1 text-[0.75rem] font-medium text-[var(--brand-ink)]",
            "transition-transform duration-150 group-hover:translate-x-0.5",
          )}
        >
          {canWrite ? "View and edit" : "View details"}
          <ArrowRight size={13} aria-hidden />
        </p>
      </div>
    </article>
  );
}
