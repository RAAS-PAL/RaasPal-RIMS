"use client";

import { EditSection } from "@/components/ui/edit-section";
import type { InventoryItemResponse, RobotStockEntryResponse } from "@/lib/backend-types";

import { EditPartForm } from "./edit-part-form";

/**
 * The Edit button on a part's page, and what it opens.
 *
 * <p>A client component because {@link EditSection} takes a callback and the page
 * rendering it is a server component, which cannot pass one across the boundary.
 *
 * <p>Note the count is deliberately not in here: stock moves only through a recorded
 * movement, which is its own control and stays available without entering edit mode.
 */
export function PartEditSection({
  item,
  robots,
  canEdit,
}: {
  item: InventoryItemResponse;
  robots: RobotStockEntryResponse[];
  canEdit: boolean;
}) {
  return (
    <EditSection
      canEdit={canEdit}
      label="Edit part"
      render={(close) => <EditPartForm item={item} robots={robots} onDone={close} />}
    />
  );
}
