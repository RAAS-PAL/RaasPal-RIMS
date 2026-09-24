import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, CircleSlash, PackageCheck } from "lucide-react";
import Link from "next/link";

import { EmptyState, Panel, PanelBody, PanelFlush, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { StatTile } from "@/components/ui/stat";
import type { MkDashboard } from "@/lib/mk-stock";
import { num } from "@/lib/format";
import { InOutChart } from "./in-out-chart";
import { MiniBar, MkStatusBadge, MovementTable, mkDay } from "./mk-bits";

/**
 * The MK spare-parts dashboard, shared by RAAS PAL staff and MK's PIN view. {@code stockHref}
 * and {@code partHref} point at each audience's own pages ("/mk-stock/parts" or "/mk/stock").
 */
export function MkDashboardView({
  data,
  stockHref,
  partHref,
}: {
  data: MkDashboard;
  stockHref: string;
  partHref: (partId: string) => string;
}) {
  const topMax = Math.max(0, ...data.topOut.map((t) => t.units));
  const reasonMax = Math.max(0, ...data.outReasons.map((r) => r.units));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Parts tracked" value={num(data.parts)} unit={data.parts === 1 ? "part" : "parts"}
          icon={<Boxes size={16} aria-hidden />} href={stockHref} />
        <StatTile label="Units on hand" value={num(data.unitsOnHand)} unit="units" icon={<PackageCheck size={16} aria-hidden />} />
        <StatTile label="Low stock" value={num(data.lowStock)} unit={data.lowStock === 1 ? "part" : "parts"}
          tone={data.lowStock > 0 ? "warn" : "ok"} hint="At or below the minimum" icon={<AlertTriangle size={16} aria-hidden />}
          href={`${stockHref}?status=LOW`} />
        <StatTile label="Out of stock" value={num(data.outOfStock)} unit={data.outOfStock === 1 ? "part" : "parts"}
          tone={data.outOfStock > 0 ? "crit" : "ok"} icon={<CircleSlash size={16} aria-hidden />} href={`${stockHref}?status=OUT`} />
        <StatTile label="Stock in" value={num(data.unitsIn)} unit="units" hint="In this period" icon={<ArrowDownToLine size={16} aria-hidden />} />
        <StatTile label="Stock out" value={num(data.unitsOut)} unit="units" hint="In this period" icon={<ArrowUpFromLine size={16} aria-hidden />} />
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle>Stock in and out</PanelTitle>
          <p className="text-[0.75rem] text-muted">
            {mkDay(data.from)} – {mkDay(data.to)} · {num(data.movements)} {data.movements === 1 ? "movement" : "movements"}
            {data.adjustments > 0 ? ` · ${num(data.adjustments)} ${data.adjustments === 1 ? "correction" : "corrections"}` : ""}
          </p>
        </PanelHeader>
        <PanelBody>
          <InOutChart data={data} />
        </PanelBody>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader><PanelTitle>Most used parts</PanelTitle></PanelHeader>
          <PanelBody>
            {data.topOut.length === 0 ? (
              <p className="py-6 text-center text-[0.8125rem] text-muted">Nothing went out in this period.</p>
            ) : (
              <ul className="space-y-3">
                {data.topOut.map((t) => (
                  <li key={t.partId}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-[0.8125rem]">
                      <Link href={partHref(t.partId)} className="min-w-0 truncate underline-offset-2 hover:underline">
                        <span className="font-mono text-[0.75rem] font-semibold">{t.partNo}</span>
                        <span className="ml-2 text-muted">{t.name}</span>
                      </Link>
                      <span className="shrink-0 font-mono font-semibold tabular-nums">{num(t.units)} {t.unit}</span>
                    </div>
                    <MiniBar value={t.units} max={topMax} tone="warn" />
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader><PanelTitle>Why stock went out</PanelTitle></PanelHeader>
          <PanelBody>
            {data.outReasons.length === 0 ? (
              <p className="py-6 text-center text-[0.8125rem] text-muted">Nothing went out in this period.</p>
            ) : (
              <ul className="space-y-3">
                {data.outReasons.map((r) => (
                  <li key={r.reason}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-[0.8125rem]">
                      <span className="min-w-0 truncate" title={r.reason}>{r.reason}</span>
                      <span className="shrink-0 text-muted">
                        <span className="font-mono font-semibold tabular-nums text-fg">{num(r.units)}</span> units ·{" "}
                        {num(r.movements)}×
                      </span>
                    </div>
                    <MiniBar value={r.units} max={reasonMax} />
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle>Needs attention</PanelTitle>
          <p className="text-[0.75rem] text-muted">Out of stock or at/below the minimum level</p>
        </PanelHeader>
        {data.attention.length === 0 ? (
          <EmptyState icon={<PackageCheck size={24} aria-hidden />} title="Every part is above its minimum" />
        ) : (
          <PanelFlush>
            <ul className="divide-y divide-[var(--line)]">
              {data.attention.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-[0.8125rem] sm:px-5">
                  <Link href={partHref(p.id)} className="min-w-0 flex-1 truncate underline-offset-2 hover:underline">
                    <span className="font-mono text-[0.75rem] font-semibold">{p.partNo}</span>
                    <span className="ml-2 text-muted">{p.name}</span>
                  </Link>
                  <span className="shrink-0 font-mono tabular-nums">
                    {num(p.quantityOnHand)} / min {num(p.minLevel)} {p.unit}
                  </span>
                  <MkStatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          </PanelFlush>
        )}
      </Panel>

      <Panel>
        <PanelHeader><PanelTitle>Latest movements</PanelTitle></PanelHeader>
        {data.recent.length === 0 ? (
          <EmptyState icon={<Boxes size={24} aria-hidden />} title="No stock has moved yet" />
        ) : (
          <PanelFlush>
            <MovementTable rows={data.recent} partHref={partHref} />
          </PanelFlush>
        )}
      </Panel>
    </div>
  );
}
