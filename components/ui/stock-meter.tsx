import { cx, num } from "@/lib/format";
import type { Robot } from "@/lib/types";
import { summarizeStock } from "@/lib/types";

/**
 * The stock meter — the one device this interface is built around.
 *
 * Service robots all wear a segmented charge gauge, so inventory is read the
 * same way here: cells filling a track. It answers the three questions an
 * operator actually has, in one glance and without reading a number:
 *
 *   how much can I sell   — solid cyan
 *   how much is promised  — pale cyan
 *   how much is on demo   — hatched, so it survives greyscale
 *
 * The notch on the track is the reorder point. Fill short of the notch means
 * order more. Nothing else in the product uses this shape.
 */
export function StockMeter({
  robot,
  density = "full",
  className,
}: {
  robot: Robot;
  /** `compact` drops the written breakdown for use inside table rows. */
  density?: "full" | "compact";
  className?: string;
}) {
  const { onHand, demo, reserved } = summarizeStock(robot);
  const committed = Math.min(reserved, onHand);
  const available = Math.max(0, onHand - committed);
  const total = onHand + demo;

  /* The track always reaches at least twice the reorder point, so the notch
     sits mid-track and "well stocked" and "about to run out" look different. */
  const scale = Math.max(total, robot.reorderPoint * 2, 6);
  const pct = (value: number) => `${(value / scale) * 100}%`;

  const description =
    total === 0
      ? "No units held"
      : [
          available > 0 && `${available} available`,
          committed > 0 && `${committed} reserved`,
          demo > 0 && `${demo} on demo`,
        ]
          .filter(Boolean)
          .join(", ") + `, reorder at ${robot.reorderPoint}`;

  return (
    <div className={cx("min-w-0", className)}>
      <div
        role="img"
        aria-label={`Stock: ${description}.`}
        className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--meter-track)]"
      >
        <div className="flex h-full">
          <span
            className="h-full bg-[var(--brand-meter)]"
            style={{ width: pct(available) }}
          />
          <span
            className="h-full bg-[var(--meter-reserved)]"
            style={{ width: pct(committed) }}
          />
          <span className="hatch h-full" style={{ width: pct(demo) }} />
        </div>

        {/* Battery-cell rules, drawn over the fill. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 7px, var(--meter-cell) 7px 9px)",
          }}
        />

        {/* Reorder notch. */}
        {robot.reorderPoint > 0 && robot.reorderPoint < scale ? (
          <span
            aria-hidden
            title={`Reorder point: ${robot.reorderPoint} units`}
            className="absolute top-0 h-full w-px bg-[var(--fg)] opacity-45"
            style={{ left: pct(robot.reorderPoint) }}
          />
        ) : null}
      </div>

      {density === "full" ? (
        <dl className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-muted">
          <MeterKey swatch="available" label="Available" value={available} />
          {committed > 0 ? (
            <MeterKey swatch="reserved" label="Reserved" value={committed} />
          ) : null}
          {demo > 0 ? <MeterKey swatch="demo" label="Demo" value={demo} /> : null}
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-px bg-[var(--fg)] opacity-45" />
            <dt>Reorder at</dt>
            <dd className="tnum font-mono font-semibold text-fg">
              {num(robot.reorderPoint)}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

const SWATCH: Record<string, string> = {
  available: "bg-[var(--brand-meter)]",
  reserved: "bg-[var(--meter-reserved)]",
  demo: "hatch",
};

function MeterKey({
  swatch,
  label,
  value,
}: {
  swatch: keyof typeof SWATCH | string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={cx("inline-block size-2.5 rounded-[2px]", SWATCH[swatch])}
      />
      <dt>{label}</dt>
      <dd className="tnum font-mono font-semibold text-fg">{num(value)}</dd>
    </div>
  );
}
