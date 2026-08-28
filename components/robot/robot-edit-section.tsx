"use client";

import { EditSection } from "@/components/ui/edit-section";
import type { RobotStockEntryResponse } from "@/lib/backend-types";

import { DeleteRobotButton } from "./delete-robot-button";
import { RobotStockForm } from "./robot-stock-form";

/**
 * The Edit button on a robot's page, and what it opens.
 *
 * <p>A client component because {@link EditSection} takes a callback and the page
 * rendering it is a server component, which cannot pass one across the boundary.
 *
 * <p>Removing the entry lives inside the editor rather than on the page: deleting is
 * not something to offer to someone who came to look up a count.
 */
export function RobotEditSection({
  entry,
  canEdit,
}: {
  entry: RobotStockEntryResponse;
  canEdit: boolean;
}) {
  return (
    <EditSection
      canEdit={canEdit}
      label="Edit robot"
      render={(close) => (
        <div className="space-y-5">
          <RobotStockForm entry={entry} onDone={close} />
          <DeleteRobotButton id={entry.id} name={entry.displayName} />
        </div>
      )}
    />
  );
}
