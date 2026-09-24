import type { MkDashboard } from "@/lib/mk-stock";
import { num } from "@/lib/format";

const IN_COLOUR = "var(--brand-500)";
const OUT_COLOUR = "var(--warn-dot)";

function bucketLabel(iso: string, granularity: MkDashboard["granularity"]): string {
  const d = new Date(`${iso}T00:00:00`);
  if (granularity === "MONTH") return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Units in and out per day, week or month, as paired bars. Plain SVG: two series and a
 * baseline need no chart library, and it renders on the server for both audiences.
 */
export function InOutChart({ data }: { data: MkDashboard }) {
  const { series, granularity } = data;
  const max = Math.max(1, ...series.flatMap((p) => [p.in, p.out]));
  const width = 720;
  const height = 200;
  const pad = { top: 12, right: 8, bottom: 26, left: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const slot = plotW / Math.max(1, series.length);
  const bar = Math.max(2, Math.min(18, slot * 0.36));
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;
  // Label every nth bucket so they never overlap.
  const every = Math.max(1, Math.ceil(series.length / 12));
  const ticks = [0, Math.round(max / 2), max];

  if (series.every((p) => p.in === 0 && p.out === 0)) {
    return <p className="py-10 text-center text-[0.8125rem] text-muted">No stock moved in this period.</p>;
  }

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img"
        aria-label={`Stock in ${num(data.unitsIn)} and out ${num(data.unitsOut)} units per ${granularity.toLowerCase()}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--fg-subtle)">{num(t)}</text>
          </g>
        ))}
        {series.map((p, i) => {
          const cx = pad.left + slot * i + slot / 2;
          return (
            <g key={p.start}>
              <title>{`${bucketLabel(p.start, granularity)}: in ${num(p.in)}, out ${num(p.out)}`}</title>
              {p.in > 0 ? <rect x={cx - bar - 1} y={y(p.in)} width={bar} height={pad.top + plotH - y(p.in)} rx="2" fill={IN_COLOUR} /> : null}
              {p.out > 0 ? <rect x={cx + 1} y={y(p.out)} width={bar} height={pad.top + plotH - y(p.out)} rx="2" fill={OUT_COLOUR} /> : null}
              {i % every === 0 ? (
                <text x={cx} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--fg-subtle)">
                  {bucketLabel(p.start, granularity)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex items-center gap-4 text-[0.75rem] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: IN_COLOUR }} />Stock in</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: OUT_COLOUR }} />Stock out</span>
        <span className="ml-auto">per {granularity === "DAY" ? "day" : granularity === "WEEK" ? "week (Mon–Sun)" : "month"}</span>
      </figcaption>
    </figure>
  );
}
