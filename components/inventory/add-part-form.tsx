"use client";

import { PackagePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Button } from "@/components/ui/button";
import { Field, NumberInput, TextInput } from "@/components/ui/field";
import { cx } from "@/lib/format";
import { createInventoryItemAction } from "@/lib/stock-actions";
import type { RobotStockEntryResponse } from "@/lib/backend-types";
import { RobotLinksField } from "./robot-links-field";

/**
 * Record a new spare part or consumable.
 *
 * <p>Opens in a dialog rather than on its own route: adding a part is something done
 * while looking at the list, and losing the list to a form page means losing the very
 * context that tells you whether the part is already there under another name.
 *
 * <p>SKU is optional. Left blank, the backend issues one from a database sequence, so
 * two people adding parts at the same moment cannot collide on it.
 */
export function AddPartForm({
  categories,
  robots,
}: {
  categories: string[];
  /** Every robot the warehouse holds, for the "fits these robots" picker. */
  robots: RobotStockEntryResponse[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <PackagePlus size={15} aria-hidden />
        Add a part
      </Button>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        aria-labelledby="add-part-title"
        className={cx(
          "m-auto max-h-[min(44rem,calc(100dvh-2rem))] w-[min(36rem,calc(100vw-2rem))]",
          "overflow-y-auto rounded-xl border border-line bg-surface p-0 text-fg",
          "shadow-[var(--shadow-pop)] backdrop:bg-transparent",
        )}
      >
        {open ? (
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="add-part-title" className="text-[0.9375rem] font-semibold leading-tight">
                  Add a part
                </h2>
                <p className="mt-1 text-[0.8125rem] text-muted">
                  Spare parts and consumables the warehouse stocks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-1 -mt-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-inset hover:text-fg"
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            <div className="mt-4">
              <AuthorizedForm
                action={createInventoryItemAction}
                intent="Add this part to the inventory record"
                detail="New part"
                submitLabel="Add part"
                onDone={() => {
                  setOpen(false);
                  // The bell badge counts low-stock parts from the app layout, which
                  // navigation alone never re-renders.
                  router.refresh();
                }}
                onCancel={() => setOpen(false)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" htmlFor="name" required className="sm:col-span-2">
                    <TextInput
                      id="name"
                      name="name"
                      required
                      placeholder="Squeegee blade, front"
                    />
                  </Field>

                  <Field
                    label="Category"
                    htmlFor="category"
                    hint="Free text. Existing categories are offered as you type."
                    required
                  >
                    <TextInput
                      id="category"
                      name="category"
                      required
                      list="part-categories"
                      placeholder="Consumables"
                    />
                    <datalist id="part-categories">
                      {categories.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="Unit" htmlFor="unitOfMeasure" hint="EA, SET, L, M.">
                    <TextInput
                      id="unitOfMeasure"
                      name="unitOfMeasure"
                      defaultValue="EA"
                      placeholder="EA"
                    />
                  </Field>

                  <Field label="SKU" htmlFor="sku" hint="Leave blank and one is issued.">
                    <TextInput id="sku" name="sku" placeholder="INV-000001" />
                  </Field>

                  <Field label="Supplier part number" htmlFor="supplierPartNo">
                    <TextInput id="supplierPartNo" name="supplierPartNo" />
                  </Field>

                  <Field
                    label="Opening stock"
                    htmlFor="openingQuantity"
                    hint="Recorded as a receipt, so the first units are traceable too."
                  >
                    <NumberInput
                      id="openingQuantity"
                      name="openingQuantity"
                      type="number"
                      min={0}
                      defaultValue="0"
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
                      defaultValue="10"
                    />
                  </Field>

                  <Field label="Unit cost" htmlFor="unitCost" hint="Baht, per unit. Optional.">
                    <NumberInput id="unitCost" name="unitCost" type="number" min={0} step="0.01" />
                  </Field>

                  <Field label="Location" htmlFor="location" hint="Where it is kept.">
                    <TextInput id="location" name="location" placeholder="Warehouse · Rack B" />
                  </Field>

                  <div className="sm:col-span-2">
                    <RobotLinksField robots={robots} />
                  </div>
                </div>
              </AuthorizedForm>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
