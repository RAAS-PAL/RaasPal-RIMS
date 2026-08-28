import Link from "next/link";

import { StockBadge } from "@/components/ui/badge";
import type { InventoryItemResponse } from "@/lib/backend-types";
import { baht, num, stamp } from "@/lib/format";
import { AdjustStock } from "./adjust-stock";

/**
 * Every part, with its live count.
 *
 * <p>A server component: the only interactive part of a row is the adjust control,
 * and shipping the whole table to the browser to get one dialog would be paying for
 * the rest of it for nothing.
 */
export function PartsTable({
  items,
  canEdit,
}: {
  items: InventoryItemResponse[];
  canEdit: boolean;
}) {
  return (
    <table className="w-full text-left text-[0.8125rem]">
      <thead>
        <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
          <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Part</th>
          <th scope="col" className="px-3 py-2.5 font-medium">Category</th>
          <th scope="col" className="px-3 py-2.5 font-medium">Location</th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">On hand</th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">Reorder at</th>
          <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
          <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">
            {canEdit ? "Adjust" : "Updated"}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--line)]">
        {items.map((item) => (
          <tr key={item.id} className="align-top hover:bg-subtle">
            <th scope="row" className="px-4 py-3 font-normal sm:px-5">
              <Link
                href={`/inventory/${item.id}`}
                className="font-semibold underline-offset-2 hover:underline"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 font-mono text-[0.6875rem] text-muted">
                {item.sku}
                {item.supplierPartNo ? ` · ${item.supplierPartNo}` : ""}
              </p>
              {/* Which robots, not how many: "3 robots" tells an operator nothing
                  they can act on, and the names are what they are looking for. */}
              {item.robots.length > 0 ? (
                <p className="mt-1 text-[0.6875rem] text-muted">
                  {item.robots.map((robot) => robot.displayName).join(" · ")}
                </p>
              ) : null}
            </th>
            <td className="px-3 py-3 text-muted">{item.category}</td>
            <td className="px-3 py-3 text-muted">{item.location ?? "—"}</td>
            <td className="px-3 py-3 text-right">
              <span className="font-mono font-semibold tabular-nums">
                {num(item.quantityOnHand)}
              </span>
              <span className="ml-1 text-[0.6875rem] text-muted">{item.unitOfMeasure}</span>
              {item.unitCost != null ? (
                <p className="mt-0.5 text-[0.6875rem] text-faint">
                  {baht(item.unitCost * item.quantityOnHand)}
                </p>
              ) : null}
            </td>
            <td className="px-3 py-3 text-right font-mono tabular-nums text-muted">
              {num(item.reorderPoint)}
            </td>
            <td className="px-3 py-3">
              {/* Zero and "low" are separate states: none left stops work today,
                  below the reorder point is a purchasing job for this week. */}
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
            <td className="px-4 py-3 text-right sm:px-5">
              {canEdit ? (
                <AdjustStock item={item} />
              ) : (
                <span className="text-[0.6875rem] text-muted">{stamp(item.updatedAt)}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
