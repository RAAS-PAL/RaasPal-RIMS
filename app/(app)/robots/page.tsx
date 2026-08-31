import { PackagePlus, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { RobotGrid } from "@/components/robot/robot-grid";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import {
  asRobotType,
  ROBOT_TYPE_LABELS,
  STATUS_HINTS,
  STATUS_LABELS,
  WAREHOUSE_STATUSES,
  type RobotStockEntryResponse,
} from "@/lib/backend-types";
import { num } from "@/lib/format";
import { can } from "@/lib/rbac";
import { listRobotStock } from "@/lib/stock-data";

export const metadata: Metadata = { title: "Robots" };

/** One removable filter pill. Shared so the two chips cannot drift apart. */
const CHIP =
  "inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-inset py-1 pl-3 pr-2 font-medium transition-colors hover:border-[var(--fg-subtle)]";

/**
 * Robots the warehouse holds.
 *
 * <p>The catalogue toolbar that used to sit on top of this page is gone. It filtered
 * by category, stock level and sort order — all shapes of the seed data, none of
 * which the real record has: entries carry a type, a count and a status, and there
 * are few enough of them to read at a glance. Controls that filter fields nothing
 * stores are worse than absent, because they look like they work.
 *
 * <p>Two filters live in the URL. `?type=` survives because the sidebar links to it;
 * `?q=` is where the command palette sends you when you want the whole result set
 * rather than the handful of rows a dropdown can hold. Both are applied here rather
 * than in the query so an unknown value degrades to "show everything" instead of an
 * empty page — a stale bookmark should not look like an empty warehouse.
 */
export default async function RobotsPage(props: PageProps<"/robots">) {
  const user = await requireUser();
  const params = await props.searchParams;
  const all = await listRobotStock();

  const raw = params.type;
  const type = asRobotType(Array.isArray(raw) ? raw[0] : raw);

  const rawQuery = params.q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";

  const byType = type ? all.filter((robot) => robot.robotType === type) : all;
  const robots = query ? byType.filter((robot) => matches(robot, query)) : byType;

  const canWrite = can(user, "stock:write");

  return (
    <>
      <PageHeader
        eyebrow="Warehouse"
        title={
          query
            ? `Matches for “${query}”`
            : type
              ? `${ROBOT_TYPE_LABELS[type]} robots`
              : "Robots"
        }
        description="What the warehouse holds, as the inventory team records it."
        trail={[
          { label: "Dashboard", href: "/" },
          ...(type || query
            ? [
                { label: "Robots", href: "/robots" },
                { label: query ? `“${query}”` : ROBOT_TYPE_LABELS[type!] },
              ]
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

      {type || query ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[0.8125rem]">
          <span className="text-muted">Showing</span>
          {/* Each chip clears only itself: narrowing to a type and then searching
              within it should not force you back to the whole catalogue to undo
              one half of that. */}
          {query ? (
            <Link href={type ? `/robots?type=${type}` : "/robots"} className={CHIP}>
              “{query}”
              <X size={13} aria-hidden />
              <span className="sr-only">Clear the search</span>
            </Link>
          ) : null}
          {type ? (
            <Link
              href={query ? `/robots?q=${encodeURIComponent(query)}` : "/robots"}
              className={CHIP}
            >
              {ROBOT_TYPE_LABELS[type]}
              <X size={13} aria-hidden />
              <span className="sr-only">Clear the type filter</span>
            </Link>
          ) : null}
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
              query
                ? `Nothing matches “${query}”`
                : type
                  ? `No ${ROBOT_TYPE_LABELS[type].toLowerCase()} robots recorded`
                  : "No robots recorded yet"
            }
            action={
              query || type ? (
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
            {query
              ? "No entry carries that brand, model or version. A shorter term usually finds it — the brand on its own is enough."
              : type
                ? "Nothing of this type is on the shelf. Other types may still hold stock."
                : canWrite
                  ? "Record what is on the shelf and the counts appear here."
                  : "Nothing has been recorded yet. Warehouse staff add robots as they arrive."}
          </EmptyState>
        </Panel>
      ) : (
        <div className="space-y-5">
          {/* One band per state rather than one grid. A demo unit is on the premises
              but promised to a trial, and one under repair is not sellable at all;
              reading them alongside stock is how they get counted twice. Bands with
              nothing in them render nothing, so a warehouse holding only stock still
              sees a single heading. */}
          {WAREHOUSE_STATUSES.map((status) => (
            <RobotGroup
              key={status}
              title={STATUS_LABELS[status]}
              hint={STATUS_HINTS[status]}
              robots={robots.filter((robot) => robot.status === status)}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Does this entry match what someone typed?
 *
 * <p>Every term has to appear somewhere, so "gausium m75" narrows the way a reader
 * expects rather than widening it the way an OR would. Matched against the assembled
 * display name and the fields it is built from, plus the note — the note is where
 * anything distinguishing about a particular unit tends to end up.
 */
function matches(robot: RobotStockEntryResponse, query: string): boolean {
  const haystack = [robot.displayName, robot.brand, robot.model, robot.version, robot.note]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return query
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

/**
 * One status band — a heading, a unit total, then a grid of cards.
 *
 * <p>Not a panel wrapping the grid: a border around cards that already have borders
 * reads as a box inside a box. The heading rule carries the grouping on its own.
 *
 * <p>The count in the heading is the whole group, not what is currently drawn — the
 * grid below fills in as you scroll, and a total that grew while you scrolled would
 * make the shelf look like it was changing under you.
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

      <RobotGrid robots={robots} canWrite={canWrite} />
    </section>
  );
}
