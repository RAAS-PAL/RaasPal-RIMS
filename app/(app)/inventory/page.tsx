import { AlertTriangle, Boxes, PackageCheck, PackagePlus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AddPartForm } from "@/components/inventory/add-part-form";
import { PartsFilters } from "@/components/inventory/parts-filters";
import { PartsTable } from "@/components/inventory/parts-table";
import { EmptyState, Panel, PanelFlush } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat";
import { requireUser } from "@/lib/auth";
import { num } from "@/lib/format";
import { can } from "@/lib/rbac";
import {
  getInventorySummary,
  listInventoryCategories,
  listInventoryItems,
  listRobotStock,
} from "@/lib/stock-data";

export const metadata: Metadata = { title: "Inventory" };

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/**
 * Spare parts and consumables — the real `inventory_items` table.
 *
 * <p>This page used to render the seed catalogue: robots dressed as inventory, with
 * per-site stock, reservations and buy-off prices that exist nowhere in the database.
 * All of it is gone. Robots are counted on `/robots` from their own table; this page
 * is parts, which is what the backend's inventory endpoints actually serve.
 *
 * <p>Filtering happens in the query rather than here, so what the table shows and what
 * the count under the filters claims come from the same place.
 */
export default async function InventoryPage(props: PageProps<"/inventory">) {
  const user = await requireUser();
  const params = await props.searchParams;

  const query = one(params.q).trim();
  const category = one(params.category);
  // The dashboard links `?lowStock=true`; the header bell links `?view=attention`.
  // Both mean the same thing to an operator, so both are honoured.
  const lowStock = one(params.lowStock) === "true" || one(params.view) === "attention";

  const [items, categories, summary, robots] = await Promise.all([
    listInventoryItems({ q: query || undefined, category: category || undefined, lowStock }),
    listInventoryCategories(),
    getInventorySummary(),
    // For the "fits these robots" picker in the add dialog. Cached per render, and
    // the sidebar already reads the same list, so this is not an extra round trip.
    listRobotStock(),
  ]);

  const canEdit = can(user, "stock:write");
  const filtering = Boolean(query || category || lowStock);
  const onHand = items.reduce((sum, item) => sum + item.quantityOnHand, 0);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Inventory"
        description="Spare parts and consumables the warehouse stocks. Counts change by recording a movement, never by overwriting a total."
        trail={[{ label: "Dashboard", href: "/" }, { label: "Inventory" }]}
      >
        {canEdit ? <AddPartForm categories={categories} robots={robots} /> : null}
      </PageHeader>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          label="Parts tracked"
          value={num(summary.totalItems)}
          unit={summary.totalItems === 1 ? "part" : "parts"}
          icon={<Boxes size={16} aria-hidden />}
        />
        <StatTile
          label={filtering ? "Units shown" : "Units on hand"}
          value={num(onHand)}
          unit="units"
          icon={<PackageCheck size={16} aria-hidden />}
        />
        <StatTile
          label="Needs restocking"
          value={num(summary.lowStockCount)}
          unit={summary.lowStockCount === 1 ? "part" : "parts"}
          tone={summary.lowStockCount > 0 ? "warn" : "ok"}
          hint="At or below the reorder point"
          icon={<AlertTriangle size={16} aria-hidden />}
          href="/inventory?lowStock=true"
        />
      </div>

      <Suspense
        fallback={<div className="mb-5 h-[6.5rem] rounded-lg border border-line bg-surface" />}
      >
        <PartsFilters categories={categories} resultCount={items.length} />
      </Suspense>

      <Panel>
        {items.length === 0 ? (
          <EmptyState
            icon={<PackagePlus size={26} aria-hidden />}
            title={filtering ? "Nothing matches those filters" : "No parts recorded yet"}
          >
            {filtering
              ? "Clear the filters to see every part."
              : canEdit
                ? "Add the spare parts and consumables the warehouse keeps, and their counts appear here."
                : "Nothing has been recorded yet. Warehouse staff add parts as they arrive."}
          </EmptyState>
        ) : (
          <PanelFlush>
            <PartsTable items={items} canEdit={canEdit} />
          </PanelFlush>
        )}
      </Panel>
    </>
  );
}
