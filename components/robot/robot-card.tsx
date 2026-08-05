import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CATEGORY_META } from "@/lib/catalog";
import { baht, cx } from "@/lib/format";
import type { Robot } from "@/lib/types";
import { summarizeStock } from "@/lib/types";
import { DemoChip, StockBadge } from "@/components/ui/badge";
import { StockMeter } from "@/components/ui/stock-meter";
import { RobotImage } from "./robot-image";

/**
 * The catalogue card. Everything on it answers a question someone actually
 * asks about a robot: what is it, what does it cost, can I sell one today.
 */
export function RobotCard({ robot }: { robot: Robot }) {
  const stock = summarizeStock(robot);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-150 hover:border-line-strong focus-within:border-[var(--focus)]">
      <RobotImage
        name={robot.name}
        category={robot.category}
        src={robot.image}
        className="aspect-4/3 border-b border-line"
      />

      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="eyebrow">{CATEGORY_META[robot.category].label}</p>
          <p className="shrink-0 font-mono text-[0.625rem] text-faint">
            {robot.modelId}
          </p>
        </div>

        <h3 className="mt-1.5 text-[0.9375rem] font-semibold leading-tight">
          {/* The whole card is the hit target; the link keeps the accessible name. */}
          <Link href={`/robots/${robot.slug}`} className="outline-none">
            <span className="absolute inset-0" aria-hidden />
            {robot.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-[0.75rem] text-muted">{robot.tagline}</p>

        <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-line pt-3">
          <span className="text-[0.6875rem] text-muted">Buy-off</span>
          <span className="font-mono text-[0.9375rem] font-semibold tabular-nums">
            {baht(robot.buyOff)}
          </span>
        </div>

        <div className="mt-3">
          <StockMeter robot={robot} density="compact" />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <StockBadge state={stock.state} count={stock.onHand} />
          <DemoChip count={stock.demo} />
        </div>

        <p
          className={cx(
            "mt-3 flex items-center gap-1 text-[0.75rem] font-medium text-[var(--brand-ink)]",
            "transition-transform duration-150 group-hover:translate-x-0.5",
          )}
        >
          View details
          <ArrowRight size={13} aria-hidden />
        </p>
      </div>
    </article>
  );
}
