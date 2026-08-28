"use client";

import { useRouter } from "next/navigation";

import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Field, NumberInput, TextInput } from "@/components/ui/field";
import type { InventoryItemResponse, RobotStockEntryResponse } from "@/lib/backend-types";
import { updateInventoryItemAction } from "@/lib/stock-actions";

import { RobotLinksField } from "./robot-links-field";

/**
 * Edit a part, including which robots it fits.
 *
 * <p>Inline on the part's own page rather than in a dialog, unlike adding: adding
 * happens while scanning the list and must not lose it, whereas editing is already
 * the reason you are on this page.
 *
 * <p>Deliberately cannot change the count. Stock moves only through a recorded
 * movement, so a number typed here would be a balance with no reason attached.
 */
export function EditPartForm({
  item,
  robots,
}: {
  item: InventoryItemResponse;
  robots: RobotStockEntryResponse[];
}) {
  const router = useRouter();

  return (
    <AuthorizedForm
      action={updateInventoryItemAction}
      intent="Save these changes to the part record"
      detail={item.name}
      submitLabel="Save changes"
      onDone={() => router.refresh()}
    >
      <input type="hidden" name="id" value={item.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required className="sm:col-span-2">
          <TextInput id="name" name="name" required defaultValue={item.name} />
        </Field>

        <Field label="Category" htmlFor="category" required>
          <TextInput id="category" name="category" required defaultValue={item.category} />
        </Field>

        <Field label="Unit" htmlFor="unitOfMeasure" hint="EA, SET, L, M.">
          <TextInput id="unitOfMeasure" name="unitOfMeasure" defaultValue={item.unitOfMeasure} />
        </Field>

        <Field label="SKU" htmlFor="sku">
          <TextInput id="sku" name="sku" defaultValue={item.sku} />
        </Field>

        <Field label="Supplier part number" htmlFor="supplierPartNo">
          <TextInput
            id="supplierPartNo"
            name="supplierPartNo"
            defaultValue={item.supplierPartNo ?? ""}
          />
        </Field>

        <Field
          label="Reorder point"
          htmlFor="reorderPoint"
          hint="At or below this, it is flagged on the dashboard."
        >
          <NumberInput
            id="reorderPoint"
            name="reorderPoint"
            type="number"
            min={0}
            defaultValue={String(item.reorderPoint)}
          />
        </Field>

        <Field label="Unit cost" htmlFor="unitCost" hint="Baht, per unit. Optional.">
          <NumberInput
            id="unitCost"
            name="unitCost"
            type="number"
            min={0}
            step="0.01"
            defaultValue={item.unitCost == null ? "" : String(item.unitCost)}
          />
        </Field>

        <Field label="Location" htmlFor="location" hint="Where it is kept.">
          <TextInput id="location" name="location" defaultValue={item.location ?? ""} />
        </Field>

        <div className="sm:col-span-2">
          <RobotLinksField robots={robots} selectedIds={item.robots.map((r) => r.id)} />
        </div>
      </div>
    </AuthorizedForm>
  );
}
