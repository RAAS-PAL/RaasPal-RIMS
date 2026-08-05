import { AlertTriangle, FlaskConical, PackageCheck, Warehouse } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { Panel, PanelFlush } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat";
import { requireUser } from "@/lib/auth";
import { readClock } from "@/lib/clock";
import { CATEGORIES, summarizeStock, type CategoryId, type Robot } from "@/lib/types";
import { bahtCompactly, num } from "@/lib/format";
import { can } from "@/lib/rbac";
import { warehouseName } from "@/lib/catalog";
import { listRobots } from "@/lib/store";

export const metadata: Metadata = { title: "Inventory" };

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export default async function InventoryPage(props: PageProps<"/inventory">) {
  const user = await requireUser();
  const params = await props.searchParams;
  const robots = await listRobots();
  const now = await readClock();

  const site = one(params.site);
  const view = one(params.view);
  const query = one(params.q).trim().toLowerCase();
  const rawCategory = one(params.category);
  const category = (CATEGORIES as readonly string[]).includes(rawCategory)
    ? (rawCategory as CategoryId)
    : "";

  let results: Robot[] = robots;
  if (category) results = results.filter((robot) => robot.category === category);
  if (query) {
    results = results.filter(
      (robot) =>
        robot.name.toLowerCase().includes(query) ||
        robot.modelId.toLowerCase().includes(query),
    );
  }
  if (site) {
    /* Showing a single site means showing what that site actually touches. */
    results = results.filter((robot) =>
      robot.locations.some(
        (location) =>
          location.code === site && (location.onHand > 0 || location.demo > 0),
      ),
    );
  }
  if (view) {
    results = results.filter((robot) => {
      const stock = summarizeStock(robot);
      if (view === "attention") return stock.state !== "in-stock";
      if (view === "demo") return stock.demo > 0;
      if (view === "reserved") return stock.reserved > 0;
      return true;
    });
  }

  results = [...results].sort((a, b) => {
    const stockA = summarizeStock(a);
    const stockB = summarizeStock(b);
    const rank = { "out-of-stock": 0, "low-stock": 1, "in-stock": 2 } as const;
    return rank[stockA.state] - rank[stockB.state] || a.name.localeCompare(b.name);
  });

  /* Totals follow the site filter so the tiles and the table agree. */
  const scope = site
    ? robots.map((robot) => {
        const held = robot.locations.find((location) => location.code === site);
        return {
          robot,
          onHand: held?.onHand ?? 0,
          demo: held?.demo ?? 0,
        };
      })
    : robots.map((robot) => {
        const stock = summarizeStock(robot);
        return { robot, onHand: stock.onHand, demo: stock.demo };
      });

  const onHand = scope.reduce((sum, entry) => sum + entry.onHand, 0);
  const demo = scope.reduce((sum, entry) => sum + entry.demo, 0);
  const value = scope.reduce(
    (sum, entry) => sum + entry.onHand * entry.robot.buyOff,
    0,
  );
  const attention = robots.filter(
    (robot) => summarizeStock(robot).state !== "in-stock",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={site ? warehouseName(site) : "Inventory"}
        description={
          site
            ? `Units held at ${site}. Reserved and available figures are fleet-wide and shown as a dash here.`
            : "Every model with its live count. Adjustments are confirmed with your PIN and written to the activity log."
        }
        trail={[{ label: "Dashboard", href: "/" }, { label: "Inventory" }]}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={site ? "Units at this site" : "Units on hand"}
          value={num(onHand)}
          unit="units"
          icon={<PackageCheck size={16} aria-hidden />}
        />
        <StatTile
          label="Demo units out"
          value={num(demo)}
          unit="units"
          tone="demo"
          icon={<FlaskConical size={16} aria-hidden />}
        />
        <StatTile
          label="Stock value"
          value={bahtCompactly(value)}
          hint="At buy-off price"
          icon={<Warehouse size={16} aria-hidden />}
        />
        <StatTile
          label="Below reorder point"
          value={num(attention)}
          unit="models"
          tone={attention > 0 ? "warn" : "ok"}
          hint="Fleet-wide, regardless of site filter"
          icon={<AlertTriangle size={16} aria-hidden />}
          href="/inventory?view=attention"
        />
      </div>

      <Suspense
        fallback={<div className="mb-5 h-[6.5rem] rounded-lg border border-line bg-surface" />}
      >
        <InventoryFilters resultCount={results.length} />
      </Suspense>

      <Panel>
        <PanelFlush>
          <InventoryTable
            robots={results}
            canEdit={can(user, "stock:write")}
            site={site}
            now={now}
          />
        </PanelFlush>
      </Panel>
    </>
  );
}
