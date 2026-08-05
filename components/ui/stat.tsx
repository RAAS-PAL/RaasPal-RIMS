import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cx } from "@/lib/format";
import type { Tone } from "./badge";

interface Delta {
  /** Signed change over the named period. */
  value: number;
  /** e.g. "last 7 days" — a delta with no period is meaningless. */
  period: string;
  /** Whether an increase is a good thing for this measure. */
  goodDirection: "up" | "down";
}

const ACCENTS: Record<Tone, string> = {
  neutral: "text-muted",
  brand: "text-[var(--brand-ink)]",
  ok: "text-ok-ink",
  warn: "text-warn-ink",
  crit: "text-crit-ink",
  demo: "text-demo-ink",
};

/**
 * One headline figure. Values use the body sans at display size with the
 * font's proportional figures — tabular numerals are for columns, where digits
 * have to line up, and they make a standalone number look gappy.
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  delta,
  tone = "neutral",
  icon,
  href,
}: {
  label: string;
  value: string;
  /** Small trailing unit, e.g. "units" or "SKUs". */
  unit?: string;
  hint?: string;
  delta?: Delta;
  tone?: Tone;
  icon?: ReactNode;
  /** Makes the whole tile a link to the list it summarises. */
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.8125rem] font-medium text-muted">{label}</p>
        {icon ? <span className={cx("shrink-0", ACCENTS[tone])}>{icon}</span> : null}
      </div>

      <p className="mt-2.5 flex items-baseline gap-1.5">
        <span
          className={cx(
            "text-[1.75rem] font-semibold leading-none tracking-[-0.02em]",
            tone === "neutral" ? "text-fg" : ACCENTS[tone],
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-[0.8125rem] font-medium text-faint">{unit}</span>
        ) : null}
      </p>

      {delta || hint ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta ? <DeltaChip {...delta} /> : null}
          {hint ? <p className="text-[0.75rem] text-muted">{hint}</p> : null}
        </div>
      ) : null}
    </>
  );

  const className = cx(
    "rounded-lg border border-line bg-surface p-4",
    href && "transition-colors duration-150 hover:border-line-strong hover:bg-subtle",
  );

  return href ? (
    <Link href={href} className={cx(className, "block")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function DeltaChip({ value, period, goodDirection }: Delta) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[0.75rem] text-muted">
        <Minus size={12} aria-hidden />
        No change, {period}
      </span>
    );
  }
  const rising = value > 0;
  const good = rising === (goodDirection === "up");
  const Icon = rising ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 text-[0.75rem] font-medium",
        good ? "text-ok-ink" : "text-crit-ink",
      )}
    >
      <Icon size={12} aria-hidden />
      {rising ? "+" : "−"}
      {Math.abs(value)} {period}
    </span>
  );
}
