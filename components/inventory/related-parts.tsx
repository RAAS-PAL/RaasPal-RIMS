import { PackageSearch } from "lucide-react";
import Link from "next/link";

import { StockBadge } from "@/components/ui/badge";
import { EmptyState, Panel, PanelFlush, PanelHeader, PanelTitle } from "@/components/ui/panel";
import type { InventoryItemResponse } from "@/lib/backend-types";
import { num } from "@/lib/format";

import { PartImage } from "./part-image";

/**
 * The spare parts that fit one robot.
 *
 * <p>Shown on the robot's own page, because "what do I need to keep for this
 * machine" is asked while looking at the machine — not by going to the parts list
 * and remembering which of ninety entries apply.
 *
 * <p>A server component: every row is a link, and nothing here needs the browser.
 */
export function RelatedParts({
  items,
  robotName,
}: {
  items: InventoryItemResponse[];
  robotName: string;
}) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle
          icon={<PackageSearch size={15} aria-hidden />}
          hint={
            items.length > 0
              ? `Spare parts and consumables recorded as fitting ${robotName}.`
              : undefined
          }
        >
          Related parts
        </PanelTitle>
      </PanelHeader>

      {items.length === 0 ? (
        <EmptyState icon={<PackageSearch size={22} aria-hidden />} title="No parts linked yet">
          Open a part under Inventory and tick this robot to link them. One part can
          fit several robots.
        </EmptyState>
      ) : (
        <PanelFlush>
          <table className="w-full text-left text-[0.8125rem]">
            <thead>
              <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Part</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Category</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">On hand</th>
                <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {items.map((item) => (
                <tr key={item.id} className="align-top hover:bg-subtle">
                  <th scope="row" className="px-4 py-3 font-normal sm:px-5">
                    <div className="flex items-start gap-3">
                      <PartImage id={item.id} name={item.name} hasImage={item.hasImage} className="size-10" />
                      <div className="min-w-0">
                    <Link
                      href={`/inventory/${item.id}`}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-[0.6875rem] text-muted">
                      {item.sku}
                    </p>
                      </div>
                    </div>
                  </th>
                  <td className="px-3 py-3 text-muted">{item.category}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-mono font-semibold tabular-nums">
                      {num(item.quantityOnHand)}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    {/* Same three states as the main parts table: none left stops
                        work today, low is a purchasing job for this week. */}
                    <StockBadge
                      state={
                        item.quantityOnHand === 0
                          ? "out-of-stock"
                          : item.lowStock
                            ? "low-stock"
                            : "in-stock"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelFlush>
      )}
    </Panel>
  );
}
