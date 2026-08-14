"use client";

import { PackagePlus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { createRobotStockAction, updateRobotStockAction } from "@/lib/stock-actions";
import {
  ROBOT_TYPE_LABELS,
  ROBOT_TYPES,
  type RobotStockEntryResponse,
} from "@/lib/backend-types";
import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Field, Select, TextInput } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { RobotImagePicker } from "./image-picker";

/**
 * Add or edit a robot the warehouse holds.
 *
 * <p>Backed by a standalone table with no link to the fleet, which is what makes a
 * plain quantity honest here — this records what someone counted on a shelf, and
 * claims nothing about serial numbers, deployments or telemetry.
 *
 * <p>One component for both modes: an edit form that drifts from its create form is
 * how a field ends up saveable in one and not the other.
 */
export function RobotStockForm({
  entry,
  redirectTo,
}: {
  /** Present when editing; absent when adding. */
  entry?: RobotStockEntryResponse;
  /**
   * Where to go once the save succeeds, and where Cancel returns to.
   *
   * <p>A path rather than a callback, because both pages that render this form are
   * server components and cannot hand a function across the boundary.
   */
  redirectTo?: string;
}) {
  const router = useRouter();
  const editing = Boolean(entry);

  // Leaving the form is what makes a save feel finished: staying on a filled-in form
  // after "Robot added" reads as though nothing happened, and invites a second submit.
  const leave = redirectTo ? () => router.push(redirectTo) : undefined;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle
          eyebrow="Warehouse"
          hint={
            editing
              ? "Changes apply to this entry only."
              : "One entry per robot per status — stock and demo are counted separately."
          }
          icon={editing ? <Pencil size={16} aria-hidden /> : <PackagePlus size={16} aria-hidden />}
        >
          {editing ? `Edit ${entry?.displayName}` : "Add a robot"}
        </PanelTitle>
      </PanelHeader>

      <PanelBody>
        <AuthorizedForm
          action={editing ? updateRobotStockAction : createRobotStockAction}
          intent={editing ? "Save these changes" : "Add this robot to the warehouse record"}
          detail={editing ? (entry?.displayName ?? "") : "New robot"}
          submitLabel={editing ? "Save changes" : "Add robot"}
          onDone={leave}
          onCancel={leave}
        >
          {editing ? <input type="hidden" name="id" value={entry?.id} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="robotType">
              {/* Driven off the shared list rather than hand-written options: a form
                  that offers fewer types than the platform stores is how a robot ends
                  up filed under the wrong one. */}
              <Select id="robotType" name="robotType" defaultValue={entry?.robotType ?? "CLEANING"}>
                {ROBOT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ROBOT_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Brand" htmlFor="brand" required>
              <TextInput
                id="brand"
                name="brand"
                required
                defaultValue={entry?.brand ?? ""}
                placeholder="Gausium"
              />
            </Field>

            <Field label="Model" htmlFor="model" required>
              <TextInput
                id="model"
                name="model"
                required
                defaultValue={entry?.model ?? ""}
                placeholder="Phantas"
              />
            </Field>

            <Field
              label="Version"
              htmlFor="version"
              hint="Revision or configuration — v1.3, Roller Brush."
            >
              <TextInput
                id="version"
                name="version"
                defaultValue={entry?.version ?? ""}
                placeholder="v1.3"
              />
            </Field>

            <Field
              label="Quantity"
              htmlFor="quantity"
              hint={
                // Shown only when there is a backup: it is the undo path for the
                // commonest warehouse slip, typing 3 where 30 was meant.
                entry?.previousQuantity != null
                  ? `Previously ${entry.previousQuantity}${
                      entry.previousQuantityAt
                        ? ` · changed ${new Date(entry.previousQuantityAt).toLocaleDateString()}`
                        : ""
                    }`
                  : undefined
              }
              required
            >
              <TextInput
                id="quantity"
                name="quantity"
                type="number"
                min={0}
                required
                defaultValue={String(entry?.quantity ?? 0)}
                className="font-mono"
              />
            </Field>

            <Field
              label="Status"
              htmlFor="status"
              hint="Demo robots are held for trials and are not sellable."
            >
              <Select id="status" name="status" defaultValue={entry?.status ?? "IN_STOCK"}>
                <option value="IN_STOCK">In stock</option>
                <option value="DEMO">Demo</option>
              </Select>
            </Field>

            <Field label="Location" htmlFor="location" hint="Where it is kept.">
              <TextInput
                id="location"
                name="location"
                defaultValue={entry?.location ?? ""}
                placeholder="Warehouse"
              />
            </Field>

            <Field label="Note" htmlFor="note">
              <TextInput id="note" name="note" defaultValue={entry?.note ?? ""} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Photo" htmlFor="imageUrl">
              <RobotImagePicker initialValue={entry?.imageUrl ?? null} />
            </Field>
          </div>
        </AuthorizedForm>
      </PanelBody>
    </Panel>
  );
}
