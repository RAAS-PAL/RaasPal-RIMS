import { Chip, StockBadge } from "@/components/ui/badge";
import type { MkMovement, MkStatus } from "@/lib/mk-stock";
import { cx, num } from "@/lib/format";

const STATE = { OK: "in-stock", LOW: "low-stock", OUT: "out-of-stock" } as const;

export function MkStatusBadge({ status }: { status: MkStatus }) {
  return <StockBadge state={STATE[status]} />;
}

const TYPE_LABEL: Record<MkMovement["type"], string> = { IN: "Stock in", OUT: "Stock out", ADJUST: "Correction" };
const TYPE_TONE = { IN: "ok", OUT: "warn", ADJUST: "brand" } as const;

export function MovementChip({ type }: { type: MkMovement["type"] }) {
  return <Chip tone={TYPE_TONE[type]}>{TYPE_LABEL[type]}</Chip>;
}

export function mkDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function signed(n: number): string {
  return `${n > 0 ? "+" : ""}${num(n)}`;
}

/** Every movement as a row: when, what, how many, stock after, and why. */
export function MovementTable({
  rows,
  showPart = true,
  partHref,
}: {
  rows: MkMovement[];
  showPart?: boolean;
  /** Link each part to its page, e.g. (id) => `/mk-stock/parts/${id}`. */
  partHref?: (partId: string) => string;
}) {
  const showBy = rows.some((r) => r.createdBy);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[0.8125rem]">
        <thead>
          <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
            <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Date</th>
            {showPart ? <th scope="col" className="px-3 py-2.5 font-medium">Part</th> : null}
            <th scope="col" className="px-3 py-2.5 font-medium">Type</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">Qty</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">Stock after</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Reason / reference</th>
            {showBy ? <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">By</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {rows.map((m) => (
            <tr key={m.id} className="align-top hover:bg-subtle">
              <td className="whitespace-nowrap px-4 py-2.5 text-muted sm:px-5">{mkDay(m.movedOn)}</td>
              {showPart ? (
                <td className="px-3 py-2.5">
                  {partHref ? (
                    <a href={partHref(m.partId)} className="font-mono text-[0.75rem] font-semibold underline-offset-2 hover:underline">{m.partNo}</a>
                  ) : (
                    <span className="font-mono text-[0.75rem] font-semibold">{m.partNo}</span>
                  )}
                  <p className="text-[0.75rem] text-muted">{m.partName}</p>
                </td>
              ) : null}
              <td className="px-3 py-2.5"><MovementChip type={m.type} /></td>
              <td className={cx("px-3 py-2.5 text-right font-mono font-semibold tabular-nums",
                m.quantityChange > 0 ? "text-[var(--ok-ink)]" : "text-[var(--warn-ink)]")}>{signed(m.quantityChange)}</td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums">{num(m.balanceAfter)}</td>
              <td className="max-w-[320px] px-3 py-2.5">
                {m.reason ? <p>{m.reason}</p> : null}
                {m.reference ? <p className="text-[0.75rem] text-muted">Ref: {m.reference}</p> : null}
                {!m.reason && !m.reference ? <span className="text-faint">—</span> : null}
              </td>
              {showBy ? <td className="px-4 py-2.5 text-[0.75rem] text-muted sm:px-5">{m.createdBy}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MiniBar({ value, max, tone = "brand" }: { value: number; max: number; tone?: "brand" | "warn" }) {
  const pct = max <= 0 ? 0 : Math.max(2, Math.round((value / max) * 100));
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-inset">
      <span
        className="block h-full rounded-full"
        style={{ width: `${pct}%`, background: tone === "brand" ? "var(--brand-500)" : "var(--warn-dot)" }}
      />
    </span>
  );
}
