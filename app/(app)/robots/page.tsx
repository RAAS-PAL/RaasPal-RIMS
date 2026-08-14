import { PackagePlus, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { RobotCard } from "@/components/robot/robot-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { asRobotType, ROBOT_TYPE_LABELS } from "@/lib/backend-types";
import { num } from "@/lib/format";
import { can } from "@/lib/rbac";
import { listRobotStock } from "@/lib/stock-data";

export const metadata: Metadata = { title: "Robots" };

/**
 * Robots the warehouse holds.
 *
 * <p>The catalogue toolbar that used to sit on top of this page is gone. It filtered
 * by category, stock level and sort order — all shapes of the seed data, none of
 * which the real record has: entries carry a type, a count and a status, and there
 * are few enough of them to read at a glance. Controls that filter fields nothing
 * stores are worse than absent, because they look like they work.
 *
 * <p>One filter survives, `?type=`, because the sidebar links to it. It is applied
 * here rather than in the query so an unknown value degrades to "show everything"
 * instead of an empty page — a stale bookmark should not look like an empty warehouse.
 */
export default async function RobotsPage(props: PageProps<"/robots">) {
  const user = await requireUser();
  const params = await props.searchParams;
  const all = await listRobotStock();

  const raw = params.type;
  const type = asRobotType(Array.isArray(raw) ? raw[0] : raw);
  const robots = type ? all.filter((robot) => robot.robotType === type) : all;

  const canWrite = can(user, "stock:write");
  const inStock = robots.filter((robot) => robot.status === "IN_STOCK");
  const onDemo = robots.filter((robot) => robot.status === "DEMO");

  return (
    <>
      <PageHeader
        eyebrow="Warehouse"
        title={type ? `${ROBOT_TYPE_LABELS[type]} robots` : "Robots"}
        description="What the warehouse holds, as the inventory team records it."
        trail={[
          { label: "Dashboard", href: "/" },
          ...(type
            ? [{ label: "Robots", href: "/robots" }, { label: ROBOT_TYPE_LABELS[type] }]
            : [{ label: "Robots" }]),
        ]}
      >
        {canWrite ? (
          <ButtonLink href="/robots/add" variant="primary">
            <PackagePlus size={15} aria-hidden />
            Add a robot
          </ButtonLink>
        ) : null}
      </PageHeader>

      {type ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[0.8125rem]">
          <span className="text-muted">Showing</span>
          <Link
            href="/robots"
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-inset py-1 pl-3 pr-2 font-medium transition-colors hover:border-[var(--fg-subtle)]"
          >
            {ROBOT_TYPE_LABELS[type]}
            <X size={13} aria-hidden />
            <span className="sr-only">Clear the type filter</span>
          </Link>
          <span className="text-muted">
            · {num(robots.length)} of {num(all.length)} entries
          </span>
        </div>
      ) : null}

      {robots.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<PackagePlus size={26} aria-hidden />}
            title={
              type
                ? `No ${ROBOT_TYPE_LABELS[type].toLowerCase()} robots recorded`
                : "No robots recorded yet"
            }
            action={
              type ? (
                <ButtonLink href="/robots" variant="secondary" size="sm">
                  Show every robot
                </ButtonLink>
              ) : canWrite ? (
                <ButtonLink href="/robots/add" variant="secondary" size="sm">
                  Add the first one
                </ButtonLink>
              ) : undefined
            }
          >
            {type
              ? "Nothing of this type is on the shelf. Other types may still hold stock."
              : canWrite
                ? "Record what is on the shelf and the counts appear here."
                : "Nothing has been recorded yet. Warehouse staff add robots as they arrive."}
          </EmptyState>
        </Panel>
      ) : (
        <div className="space-y-5">
          <RobotGroup
            title="In stock"
            hint="Available to deploy or sell."
            robots={inStock}
            canWrite={canWrite}
          />
          {/* Kept as its own group rather than mixed into one grid: a demo unit is
              on the premises but promised to a trial, and reading it alongside
              sellable stock is how it gets counted twice. */}
          <RobotGroup
            title="Demo"
            hint="Out on trial — held, not sellable."
            robots={onDemo}
            canWrite={canWrite}
          />
        </div>
      )}
    </>
  );
}

/**
 * One status band — a heading, a unit total, then a grid of cards.
 *
 * <p>Not a panel wrapping the grid: a border around cards that already have borders
 * reads as a box inside a box. The heading rule carries the grouping on its own.
 */
function RobotGroup({
  title,
  hint,
  robots,
  canWrite,
}: {
  title: string;
  hint: string;
  robots: Awaited<ReturnType<typeof listRobotStock>>;
  canWrite: boolean;
}) {
  if (robots.length === 0) return null;

  const total = robots.reduce((sum, robot) => sum + robot.quantity, 0);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2.5">
        <div>
          <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
          <p className="mt-0.5 text-[0.75rem] text-muted">{hint}</p>
        </div>
        <p className="font-mono text-[0.8125rem] font-semibold">
          {num(total)}
          <span className="ml-1 font-sans text-[0.75rem] font-normal text-muted">
            {total === 1 ? "unit" : "units"}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3.5">
        {robots.map((robot) => (
          <RobotCard key={robot.id} entry={robot} canWrite={canWrite} />
        ))}
      </div>
    </section>
  );
}
