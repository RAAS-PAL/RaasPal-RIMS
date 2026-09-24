"use client";

import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Button } from "@/components/ui/button";
import { Field, NumberInput, Select, TextInput } from "@/components/ui/field";
import { num } from "@/lib/format";
import { moveMkStockAction } from "@/lib/mk-actions";
import type { MkMovementType, MkPart } from "@/lib/mk-stock";
import { MkDialog } from "./mk-dialog";

const TITLE: Record<MkMovementType, string> = { IN: "Stock in", OUT: "Stock out", ADJUST: "Correct the count" };

function todayBangkok() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

/**
 * Record stock in, stock out or a correction for one MK part. The number is typed positive
 * for in and out (the type sets the direction); a correction is signed. Stock out and
 * corrections cannot be saved without a written reason.
 */
export function MkMoveStock({ part, compact = false }: { part: MkPart; compact?: boolean }) {
  const router = useRouter();
  const [type, setType] = useState<MkMovementType | null>(null);
  const open = type !== null;
  const size = compact ? "sm" : "md";

  return (
    <>
      <Button variant="secondary" size={size} onClick={() => setType("IN")} disabled={!part.active} title="Stock in">
        <ArrowDownToLine size={14} aria-hidden /> In
      </Button>
      <Button variant="secondary" size={size} onClick={() => setType("OUT")} disabled={!part.active || part.quantityOnHand === 0} title="Stock out">
        <ArrowUpFromLine size={14} aria-hidden /> Out
      </Button>
      {compact ? null : (
        <Button variant="ghost" size={size} onClick={() => setType("ADJUST")} disabled={!part.active} title="Correct the count">
          <SlidersHorizontal size={14} aria-hidden /> Correct
        </Button>
      )}

      <MkDialog
        open={open}
        onClose={() => setType(null)}
        title={`${type ? TITLE[type] : ""} · ${part.name}`}
        subtitle={`${part.partNo} · ${num(part.quantityOnHand)} ${part.unit} on hand`}
      >
        {type ? (
          <AuthorizedForm
            action={moveMkStockAction}
            intent={type === "IN" ? "Record stock in" : type === "OUT" ? "Record stock out" : "Correct the stock count"}
            detail={`${part.partNo} · ${part.name}`}
            submitLabel="Record"
            onDone={() => {
              setType(null);
              router.refresh();
            }}
            onCancel={() => setType(null)}
          >
            <input type="hidden" name="partId" value={part.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" htmlFor={`mk-type-${part.id}`}>
                <Select id={`mk-type-${part.id}`} name="type" value={type} onChange={(e) => setType(e.target.value as MkMovementType)}>
                  <option value="IN">Stock in — received</option>
                  <option value="OUT">Stock out — taken out</option>
                  <option value="ADJUST">Correction — recount</option>
                </Select>
              </Field>
              <Field
                label="How many"
                htmlFor={`mk-qty-${part.id}`}
                required
                hint={type === "ADJUST" ? "Signed: -2 removes two, 2 adds two." : `In ${part.unit}.`}
              >
                <NumberInput
                  id={`mk-qty-${part.id}`}
                  name="quantity"
                  type="number"
                  required
                  min={type === "ADJUST" ? undefined : 1}
                  max={type === "OUT" ? part.quantityOnHand : undefined}
                  defaultValue=""
                  placeholder="0"
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field
                label="Reason"
                htmlFor={`mk-reason-${part.id}`}
                required={type !== "IN"}
                hint={type === "IN" ? "Optional for stock in." : "Required. Why it went out, or why the count changed."}
              >
                <TextInput
                  id={`mk-reason-${part.id}`}
                  name="reason"
                  required={type !== "IN"}
                  maxLength={500}
                  placeholder={type === "OUT" ? "e.g. Replaced broken tray sensor at MK Siam branch" : type === "ADJUST" ? "e.g. Recount on shelf" : "e.g. Delivery from supplier"}
                />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Reference" htmlFor={`mk-ref-${part.id}`} hint="PO, delivery note… (optional)">
                <TextInput id={`mk-ref-${part.id}`} name="reference" maxLength={100} />
              </Field>
              <Field label="Date" htmlFor={`mk-date-${part.id}`} hint="When it happened">
                <TextInput id={`mk-date-${part.id}`} name="movedOn" type="date" max={todayBangkok()} defaultValue={todayBangkok()} />
              </Field>
            </div>
          </AuthorizedForm>
        ) : null}
      </MkDialog>
    </>
  );
}
