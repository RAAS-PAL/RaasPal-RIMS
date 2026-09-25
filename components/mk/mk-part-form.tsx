"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Button } from "@/components/ui/button";
import { CheckboxRow, Field, NumberInput, TextArea, TextInput } from "@/components/ui/field";
import { createMkPartAction, updateMkPartAction } from "@/lib/mk-actions";
import type { MkPart } from "@/lib/mk-stock";
import { RobotImagePicker } from "@/components/robot/image-picker";
import { mkPhotoSrc } from "./mk-bits";
import { MkDialog } from "./mk-dialog";

/**
 * Add a part, or edit one. The count is not editable here: stock only changes through a
 * stock in, stock out or correction, so every change has a line in the history.
 */
export function MkPartForm({ part, compact = false }: { part?: MkPart; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const editing = Boolean(part);

  return (
    <>
      {editing ? (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} title={`Edit ${part!.name} - photo, name, minimum, location`}>
          <Pencil size={14} aria-hidden /> {compact ? "Edit" : "Edit details"}
        </Button>
      ) : (
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus size={16} aria-hidden /> Add part
        </Button>
      )}
      <MkDialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${part!.name}` : "Add an MK spare part"}
        subtitle={editing ? part!.partNo : undefined}
      >
        <AuthorizedForm
          action={editing ? updateMkPartAction : createMkPartAction}
          intent={editing ? "Save the part details" : "Add this part to MK's stock list"}
          detail={editing ? part!.partNo : "New part"}
          submitLabel={editing ? "Save details" : "Add part"}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
          onCancel={() => setOpen(false)}
        >
          {editing ? <input type="hidden" name="id" value={part!.id} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Part number" htmlFor="mk-partNo" required>
              <TextInput id="mk-partNo" name="partNo" required maxLength={64} defaultValue={part?.partNo ?? ""} placeholder="e.g. MK-TRAY-01" />
            </Field>
            <Field label="Name" htmlFor="mk-name" required>
              <TextInput id="mk-name" name="name" required maxLength={200} defaultValue={part?.name ?? ""} placeholder="e.g. Tray sensor" />
            </Field>
            <Field label="Robot model" htmlFor="mk-model">
              <TextInput id="mk-model" name="robotModel" maxLength={100} defaultValue={part?.robotModel ?? ""} placeholder="e.g. BellaBot" />
            </Field>
            <Field label="Unit" htmlFor="mk-unit" hint="pcs, set, box…">
              <TextInput id="mk-unit" name="unit" maxLength={20} defaultValue={part?.unit ?? "pcs"} />
            </Field>
            <Field label="Minimum level" htmlFor="mk-min" hint="Warn at or below this. 0 = no warning.">
              <NumberInput id="mk-min" name="minLevel" type="number" min={0} defaultValue={part?.minLevel ?? 0} />
            </Field>
            {editing ? (
              <Field label="Location" htmlFor="mk-location">
                <TextInput id="mk-location" name="location" maxLength={200} defaultValue={part?.location ?? ""} placeholder="e.g. RAAS PAL office, shelf B" />
              </Field>
            ) : (
              <Field label="Opening stock" htmlFor="mk-opening" hint="How many are here now. Recorded as a stock in.">
                <NumberInput id="mk-opening" name="openingQuantity" type="number" min={0} defaultValue={0} />
              </Field>
            )}
          </div>
          {editing ? null : (
            <div className="mt-4">
              <Field label="Location" htmlFor="mk-location">
                <TextInput id="mk-location" name="location" maxLength={200} placeholder="e.g. RAAS PAL office, shelf B" />
              </Field>
            </div>
          )}
          <div className="mt-4">
            <Field label="Photo" htmlFor="image" hint="Take one with your phone's camera or choose a file. It is resized before upload.">
              <RobotImagePicker name="image" initialValue={part ? mkPhotoSrc(part, "staff") : null} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Note" htmlFor="mk-note">
              <TextArea id="mk-note" name="note" rows={2} maxLength={1000} defaultValue={part?.note ?? ""} />
            </Field>
          </div>
          {editing ? (
            <div className="mt-4">
              <input type="hidden" name="active" value="false" />
              <CheckboxRow name="active" value="true" defaultChecked={part!.active} label="In use" description="Untick to retire the part. Its history stays." />
            </div>
          ) : null}
        </AuthorizedForm>
      </MkDialog>
    </>
  );
}
