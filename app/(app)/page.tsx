import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  FlaskConical,
  History,
  PackageCheck,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

import { ActivityList } from "@/components/activity/activity-list";
import { CategoryGlyph } from "@/components/robot/robot-image";
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
import { StockMeter } from "@/components/ui/stock-meter";
import {
  categoryRollups,
  fleetTotals,
  oversoldRobots,
  restockQueue,
} from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { readClock } from "@/lib/clock";
import { CATEGORY_META } from "@/lib/catalog";
import { baht, bahtCompactly, num } from "@/lib/format";
import { listActivity, listRobots } from "@/lib/store";
import { summarizeStock } from "@/lib/types";

export default async function DashboardPage() {
  const user = await requireUser();
  const [robots, activity] = await Promise.all([listRobots(), listActivity(200)]);
  const now = await readClock();

  const totals = fleetTotals(robots, activity, now);
  const rollups = categoryRollups(robots);
  const queue = restockQueue(robots);
  const oversold = oversoldRobots(robots);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${firstName}`}
        description="Where the fleet stands right now: what is on the shelf, what needs ordering and what changed since you were last here."
      >
        <ButtonLink href="/inventory" variant="secondary">
          <Warehouse size={15} aria-hidden />
          Open inventory
        </ButtonLink>
        <ButtonLink href="/robots" variant="primary">
          <Boxes size={15} aria-hidden />
          Robot catalogue
        </ButtonLink>
      </PageHeader>

      {oversold.length > 0 ? (
        <div
          role="status"
          className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--crit-dot)]/40 bg-crit-wash px-4 py-3"
        >
          <AlertTriangle size={17} aria-hidden className="shrink-0 text-crit-ink" />
          <p className="min-w-0 flex-1 text-[0.8125rem] text-crit-ink">
            <span className="font-semibold">
              {oversold.length} {oversold.length === 1 ? "robot is" : "robots are"} oversold.
            </span>{" "}
            More units are promised to signed orders than are sitting on the shelf:{" "}
            {oversold.map((robot) => robot.name).join(", ")}.
          </p>
          <ButtonLink href="/inventory?view=attention" variant="secondary" size="sm">
            Resolve
          </ButtonLink>
        </div>
      ) : null}

      <section aria-label="Fleet summary" className="mb-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          <StatTile
            label="Robots in catalogue"
            value={num(totals.skus)}
            unit="models"
            hint={`${rollups.length} categories`}
            icon={<Boxes size={16} aria-hidden />}
            href="/robots"
          />
          <StatTile
            label="Units on hand"
            value={num(totals.onHand)}
            unit="units"
            delta={{
              value: totals.netUnits7d,
              period: "last 7 days",
              goodDirection: "up",
            }}
            icon={<PackageCheck size={16} aria-hidden />}
            href="/inventory"
          />
          <StatTile
            label="Available to sell"
            value={num(totals.available)}
            unit="units"
            hint={`${num(totals.reserved)} reserved on signed orders`}
            tone="brand"
            icon={<Warehouse size={16} aria-hidden />}
          />
          <StatTile
            label="Demo units deployed"
            value={num(totals.demo)}
            unit="units"
            delta={{
              value: totals.netDemo7d,
              period: "last 7 days",
              goodDirection: "up",
            }}
            tone="demo"
            icon={<FlaskConical size={16} aria-hidden />}
          />
          <StatTile
            label="Stock value"
            value={bahtCompactly(totals.stockValue)}
            hint="On-hand units at buy-off price"
            icon={<CircleDollarSign size={16} aria-hidden />}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel>
            <PanelHeader>
              <PanelTitle
                eyebrow="Triage"
                hint="Out of stock first, then whatever is furthest below its reorder point."
                icon={<AlertTriangle size={16} aria-hidden />}
              >
                Needs restocking
              </PanelTitle>
              <div className="flex items-center gap-1.5">
                <StockBadge state="out-of-stock" count={totals.outOfStock} />
                <StockBadge state="low-stock" count={totals.lowStock} />
              </div>
            </PanelHeader>

            {queue.length === 0 ? (
              <EmptyState
                icon={<PackageCheck size={26} aria-hidden />}
                title="Every robot is above its reorder point"
                action={
                  <ButtonLink href="/inventory" variant="secondary" size="sm">
                    Review stock anyway
                  </ButtonLink>
                }
              >
                Nothing needs ordering today. New shortfalls will appear here as soon
                as counts drop.
              </EmptyState>
            ) : (
              <>
                <PanelFlush>
                  <table className="w-full text-left text-[0.8125rem]">
                    <thead>
                      <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                        <th scope="col" className="px-4 py-2 font-medium sm:px-5">
                          Robot
                        </th>
                        <th scope="col" className="px-3 py-2 font-medium">
                          Stock position
                        </th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">
                          Short by
                        </th>
                        <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">
                          Buy-off
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {queue.slice(0, 8).map((robot) => {
                        const stock = summarizeStock(robot);
                        const shortBy = Math.max(0, robot.reorderPoint - stock.onHand);
                        return (
                          <tr key={robot.slug} className="hover:bg-subtle">
                            <td className="px-4 py-3 sm:px-5">
                              <Link
                                href={`/robots/${robot.slug}`}
                                className="font-medium underline-offset-2 hover:underline"
                              >
                                {robot.name}
                              </Link>
                              <p className="mt-0.5 text-[0.6875rem] text-muted">
                                {CATEGORY_META[robot.category].label} · {robot.modelId}
                              </p>
                            </td>
                            <td className="min-w-40 px-3 py-3">
                              <StockMeter robot={robot} density="compact" />
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <StockBadge state={stock.state} count={stock.onHand} />
                                <DemoChip count={stock.demo} />
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums text-crit-ink">
                              {shortBy > 0 ? num(shortBy) : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums sm:px-5">
                              {baht(robot.buyOff)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </PanelFlush>
                {queue.length > 8 ? (
                  <PanelFooter>
                    <p className="text-[0.75rem] text-muted">
                      Showing 8 of {num(queue.length)} robots below their reorder point.
                    </p>
                    <ButtonLink href="/inventory?view=attention" variant="secondary" size="sm">
                      See all
                      <ArrowRight size={14} aria-hidden />
                    </ButtonLink>
                  </PanelFooter>
                ) : null}
              </>
            )}
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle
                eyebrow="Coverage"
                hint="Sellable, reserved and demo units held in each class of robot."
                icon={<Boxes size={16} aria-hidden />}
              >
                Fleet by category
              </PanelTitle>
            </PanelHeader>
            <PanelBody className="grid gap-3 sm:grid-cols-2">
              {rollups.map((rollup) => {
                const meta = CATEGORY_META[rollup.id];
                /* One synthetic robot stands in for the category so the same
                   meter reads at both levels of the hierarchy. */
                const asRobot = {
                  reorderPoint: rollup.skus * 3,
                  reserved: rollup.reserved,
                  locations: [
                    { code: "all", onHand: rollup.onHand, demo: rollup.demo },
                  ],
                } as Parameters<typeof StockMeter>[0]["robot"];

                return (
                  <Link
                    key={rollup.id}
                    href={`/robots?category=${rollup.id}`}
                    className="group rounded-lg border border-line p-3.5 transition-colors duration-150 hover:border-line-strong hover:bg-subtle"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-inset text-muted">
                        <CategoryGlyph category={rollup.id} className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[0.875rem] font-semibold">
                            {meta.label}
                          </p>
                          <p className="shrink-0 font-mono text-[0.6875rem] text-muted">
                            {num(rollup.skus)} {rollup.skus === 1 ? "model" : "models"}
                          </p>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[0.75rem] text-muted">
                          {meta.blurb}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <StockMeter robot={asRobot} density="compact" />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 text-[0.75rem]">
                      <span className="text-muted">
                        <span className="font-mono font-semibold tabular-nums text-fg">
                          {num(rollup.onHand)}
                        </span>{" "}
                        on hand
                      </span>
                      {rollup.needsAttention > 0 ? (
                        <span className="font-medium text-warn-ink">
                          {num(rollup.needsAttention)} need attention
                        </span>
                      ) : (
                        <span className="font-medium text-ok-ink">All stocked</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </PanelBody>
          </Panel>
        </div>

        <Panel className="xl:sticky xl:top-20 xl:self-start">
          <PanelHeader>
            <PanelTitle
              eyebrow="Audit"
              hint="Every entry names the person who confirmed it with their PIN."
              icon={<History size={16} aria-hidden />}
            >
              Recent changes
            </PanelTitle>
          </PanelHeader>
          {activity.length === 0 ? (
            <EmptyState title="Nothing has changed yet">
              Stock moves, price changes and specification edits will show up here.
            </EmptyState>
          ) : (
            <>
              <PanelFlush className="max-h-[38rem] overflow-y-auto">
                <ActivityList entries={activity.slice(0, 14)} now={now} />
              </PanelFlush>
              <PanelFooter>
                <p className="text-[0.75rem] text-muted">
                  Last 14 of {num(activity.length)} entries
                </p>
                <ButtonLink href="/activity" variant="secondary" size="sm">
                  Full log
                  <ArrowRight size={14} aria-hidden />
                </ButtonLink>
              </PanelFooter>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
