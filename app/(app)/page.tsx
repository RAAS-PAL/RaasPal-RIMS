import {
  AlertTriangle,
  Boxes,
  FlaskConical,
  PackageCheck,
  PackagePlus,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

import { DemoChip, StockBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  EmptyState,
  Panel,
  PanelBody,
  PanelFlush,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat";
import { requireUser } from "@/lib/auth";
import { num } from "@/lib/format";
import { can } from "@/lib/rbac";
import { getInventorySummary, listRobotStock } from "@/lib/stock-data";

/**
 * Everything here comes from the database. Nothing is derived from seed data.
 *
 * <p>Several tiles the mock version carried are gone, because nothing behind them
 * is real yet: stock value for robots (no price is recorded), units reserved on
 * signed orders (no such concept), and the "recent changes" audit feed (robot stock
 * keeps no activity log — parts do, through stock_movements, but that is a different
 * panel). A tile showing an invented number is worse than no tile: someone acts on it.
 */
export default async function DashboardPage() {
  const user = await requireUser();

  // Fetched together — neither depends on the other, and the dashboard should not
  // wait for two sequential round trips.
  const [robots, summary] = await Promise.all([listRobotStock(), getInventorySummary()]);

  const firstName = user.name.split(" ")[0] || user.name;
  const onHand = robots.reduce((sum, robot) => sum + robot.quantity, 0);
  const canWrite = can(user, "stock:write");

  // Sorted by what is scarcest. Zero-quantity rows come first: a robot recorded as
  // held but counted at none is the thing most worth looking at.
  const scarcest = [...robots].sort((a, b) => a.quantity - b.quantity).slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${firstName}`}
        description="What the warehouse holds right now, and which parts need ordering."
      >
        <ButtonLink href="/inventory" variant="secondary">
          <Warehouse size={15} aria-hidden />
          Open inventory
        </ButtonLink>
        {canWrite ? (
          <ButtonLink href="/robots/add" variant="primary">
            <PackagePlus size={15} aria-hidden />
            Add a robot
          </ButtonLink>
        ) : null}
      </PageHeader>

      {summary.lowStockCount > 0 ? (
        <div
          role="status"
          className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--crit-dot)]/40 bg-crit-wash px-4 py-3"
        >
          <AlertTriangle size={17} aria-hidden className="shrink-0 text-crit-ink" />
          <p className="min-w-0 flex-1 text-[0.8125rem] text-crit-ink">
            <span className="font-semibold">
              {summary.lowStockCount} {summary.lowStockCount === 1 ? "part is" : "parts are"} at
              or below the reorder point.
            </span>{" "}
            Order more before they run out.
          </p>
          <ButtonLink href="/inventory?lowStock=true" variant="secondary" size="sm">
            Review
          </ButtonLink>
        </div>
      ) : null}

      <section aria-label="Warehouse summary" className="mb-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatTile
            label="Robots on hand"
            value={num(onHand)}
            unit="units"
            hint="Stock and demo together"
            icon={<PackageCheck size={15} aria-hidden />}
          />
          <StatTile
            label="Available"
            value={num(summary.robotsInStock)}
            unit="units"
            hint="Ready to deploy or sell"
            tone={summary.robotsInStock > 0 ? "ok" : "neutral"}
            icon={<Warehouse size={15} aria-hidden />}
          />
          <StatTile
            label="Demo"
            value={num(summary.robotsOnDemo)}
            unit="units"
            // Not summed into "available" anywhere: a demo unit is on the premises
            // but promised to a trial, and counting it as sellable is how one gets
            // offered to two customers.
            hint="Out on trial — not sellable"
            icon={<FlaskConical size={15} aria-hidden />}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* ── Parts needing a reorder ─────────────────────────────────────── */}
        <Panel>
          <PanelHeader>
            <PanelTitle
              eyebrow="Alert"
              hint="At or below the reorder point set for each part."
              icon={<AlertTriangle size={16} aria-hidden />}
            >
              Needs restocking
            </PanelTitle>
          </PanelHeader>

          {summary.lowStockItems.length === 0 ? (
            <PanelBody>
              <EmptyState
                icon={<PackageCheck size={26} aria-hidden />}
                title={
                  summary.totalItems === 0
                    ? "No parts recorded yet"
                    : "Every part is above its reorder point"
                }
              >
                {summary.totalItems === 0
                  ? "Add spare parts and consumables from the inventory page, and anything running low will appear here."
                  : "Nothing needs ordering right now."}
              </EmptyState>
            </PanelBody>
          ) : (
            <>
              <PanelFlush>
                <table className="w-full text-left text-[0.8125rem]">
                  <thead>
                    <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                      <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Part</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">On hand</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Reorder at</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {summary.lowStockItems.map((item) => (
                      <tr key={item.id} className="align-top hover:bg-subtle">
                        <th scope="row" className="px-4 py-3 font-normal sm:px-5">
                          <p className="font-semibold">{item.name}</p>
                          <p className="mt-0.5 font-mono text-[0.6875rem] text-muted">
                            {item.sku}
                            {item.robotModel ? ` · ${item.robotModel}` : ""}
                          </p>
                        </th>
                        <td className="px-3 py-3">
                          <span className="font-mono font-semibold">
                            {num(item.quantityOnHand)}
                          </span>
                          <span className="ml-1 text-[0.6875rem] text-muted">
                            {item.unitOfMeasure}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-muted">
                          {num(item.reorderPoint)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PanelFlush>
              <PanelFooter>
                <Link href="/inventory?lowStock=true" className="text-[0.8125rem] font-medium">
                  See every part below its reorder point →
                </Link>
              </PanelFooter>
            </>
          )}
        </Panel>

        {/* ── Robots held ─────────────────────────────────────────────────── */}
        <Panel>
          <PanelHeader>
            <PanelTitle
              eyebrow="Warehouse"
              hint="Fewest first."
              icon={<Boxes size={16} aria-hidden />}
            >
              Robots held
            </PanelTitle>
          </PanelHeader>

          {robots.length === 0 ? (
            <PanelBody>
              <EmptyState
                icon={<PackagePlus size={26} aria-hidden />}
                title="No robots recorded yet"
                action={
                  canWrite ? (
                    <ButtonLink href="/robots/add" variant="secondary" size="sm">
                      Add the first one
                    </ButtonLink>
                  ) : undefined
                }
              >
                Once the warehouse records what it holds, the counts appear here.
              </EmptyState>
            </PanelBody>
          ) : (
            <>
              <PanelFlush>
                <table className="w-full text-left text-[0.8125rem]">
                  <thead>
                    <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                      <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Robot</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {scarcest.map((robot) => (
                      <tr key={robot.id} className="align-top hover:bg-subtle">
                        <th scope="row" className="px-4 py-3 font-normal sm:px-5">
                          <p className="font-semibold">{robot.displayName}</p>
                          <p className="mt-0.5 text-[0.6875rem] text-muted">
                            {robot.robotType.charAt(0) + robot.robotType.slice(1).toLowerCase()}
                            {robot.location ? ` · ${robot.location}` : ""}
                          </p>
                        </th>
                        <td className="px-3 py-3">
                          {/* Zero first: DemoChip renders nothing at a count of 0, which
                              would leave the cell blank and read as missing data rather
                              than as "none held". */}
                          {robot.quantity === 0 ? (
                            <StockBadge state="out-of-stock" />
                          ) : robot.status === "DEMO" ? (
                            <DemoChip count={robot.quantity} />
                          ) : (
                            <StockBadge state="in-stock" count={robot.quantity} />
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold">
                          {num(robot.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PanelFlush>
              {robots.length > scarcest.length ? (
                <PanelFooter>
                  <Link href="/robots" className="text-[0.8125rem] font-medium">
                    See all {num(robots.length)} entries →
                  </Link>
                </PanelFooter>
              ) : null}
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
