"use client";

import { Minus, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Button } from "@/components/ui/button";
import { Field, NumberInput, Select, TextInput } from "@/components/ui/field";
import type { InventoryItemResponse } from "@/lib/backend-types";
import { cx, num } from "@/lib/format";
import { adjustStockAction } from "@/lib/stock-actions";

/**
 * Change one part's count.
 *
 * <p>The operator states a movement — received twelve, issued one — never a new
 * total. A movement carries a reason and survives two people counting the same shelf
 * at once; "set it to 47" throws away both.
 *
 * <p>Direction comes from the type, and the number is always entered positive. Asking
 * a warehouse operator to type a minus sign is how stock gets added when it left.
 */
export function AdjustStock({ item }: { item: InventoryItemResponse }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [movementType, setMovementType] = useState("RECEIPT");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Adjust
      </Button>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        aria-labelledby={`adjust-${item.id}-title`}
        className={cx(
          "m-auto w-[min(30rem,calc(100vw-2rem))] rounded-xl border border-line",
          "bg-surface p-0 text-fg shadow-[var(--shadow-pop)] backdrop:bg-transparent",
        )}
      >
        {open ? (
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id={`adjust-${item.id}-title`}
                  className="text-[0.9375rem] font-semibold leading-tight"
                >
                  {item.name}
                </h2>
                <p className="mt-1 font-mono text-[0.75rem] text-muted">
                  {item.sku} · {num(item.quantityOnHand)} on hand
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
                action={adjustStockAction}
                intent={`Record a stock movement against ${item.name}`}
                detail={item.sku}
                submitLabel="Record movement"
                onDone={() => {
                  setOpen(false);
                  // The bell badge counts low-stock parts from the app layout, which
                  // navigation alone never re-renders.
                  router.refresh();
                }}
                onCancel={() => setOpen(false)}
              >
                <input type="hidden" name="itemId" value={item.id} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="What happened" htmlFor={`type-${item.id}`}>
                    <Select
                      id={`type-${item.id}`}
                      name="movementType"
                      value={movementType}
                      onChange={(event) => setMovementType(event.target.value)}
                    >
                      <option value="RECEIPT">Received — stock came in</option>
                      <option value="ISSUE">Issued — stock went out</option>
                      <option value="RETURN">Returned — came back unused</option>
                      <option value="ADJUSTMENT">Correction — recount</option>
                    </Select>
                  </Field>

                  <Field
                    label="How many"
                    htmlFor={`qty-${item.id}`}
                    hint={
                      movementType === "ADJUSTMENT"
                        ? "Signed: -3 removes three, 3 adds three."
                        : movementType === "ISSUE"
                          ? "A positive number. It is taken off the count."
                          : "A positive number. It is added to the count."
                    }
                    required
                  >
                    <NumberInput
                      id={`qty-${item.id}`}
                      name="quantityChange"
                      type="number"
                      required
                      // A correction can go either way, so the floor comes off.
                      min={movementType === "ADJUSTMENT" ? undefined : 1}
                      defaultValue=""
                      placeholder="0"
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field
                    label="Reason"
                    htmlFor={`note-${item.id}`}
                    hint="Why the count changed. This is what makes the movement readable later."
                  >
                    <TextInput
                      id={`note-${item.id}`}
                      name="note"
                      placeholder="Delivery from supplier, fitted to unit, miscount…"
                    />
                  </Field>
                </div>

                <p className="mt-4 flex items-center gap-1.5 rounded-md bg-inset px-3 py-2 text-[0.75rem] text-muted">
                  {movementType === "ISSUE" ? (
                    <Minus size={13} aria-hidden />
                  ) : (
                    <Plus size={13} aria-hidden />
                  )}
                  Currently {num(item.quantityOnHand)}, reorder at{" "}
                  {num(item.reorderPoint)}.
                </p>
              </AuthorizedForm>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
