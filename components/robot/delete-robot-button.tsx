"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteRobotStockAction } from "@/lib/stock-actions";
import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Panel, PanelBody } from "@/components/ui/panel";

/**
 * Remove an entry recorded by mistake.
 *
 * <p>A real delete, not a soft one. Nothing references these rows — no telemetry, no
 * reports, no audit trail to hollow out — so a row that never described anything in
 * the building is better gone than kept as clutter forever.
 *
 * <p>It still goes through {@link AuthorizedForm}, which names what is about to
 * happen and to which robot before anything is sent. Deleting is the one action here
 * with nothing to undo it.
 */
export function DeleteRobotButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  return (
    <Panel>
      <PanelBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.8125rem] font-semibold">
              <Trash2 size={14} aria-hidden className="text-muted" />
              Remove this entry
            </p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
              For a row added by mistake. If the warehouse simply has none left, set the
              quantity to zero instead — that keeps the record and its history.
            </p>
          </div>

          <AuthorizedForm
            action={deleteRobotStockAction}
            intent={`Permanently remove ${name} from the warehouse record`}
            detail={name}
            submitLabel="Remove"
            // Back to the list: staying on a page whose record no longer exists would
            // render a "not found" the moment anything refreshed. refresh() too, so the
            // sidebar counts drop the removed units — the layout holding them is not
            // re-rendered by navigation alone.
            onDone={() => {
              router.push("/robots");
              router.refresh();
            }}
          >
            <input type="hidden" name="id" value={id} />
          </AuthorizedForm>
        </div>
      </PanelBody>
    </Panel>
  );
}
