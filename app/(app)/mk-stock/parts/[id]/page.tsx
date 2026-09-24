import { History } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MkPartPhoto, MkStatusBadge, MovementTable, mkDay, mkPhotoSrc } from "@/components/mk/mk-bits";
import { MkMoveStock } from "@/components/mk/mk-move-stock";
import { MkPartForm } from "@/components/mk/mk-part-form";
import { EmptyState, Panel, PanelBody, PanelFlush, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import { num } from "@/lib/format";
import { staff } from "@/lib/mk-stock";
import { can } from "@/lib/rbac";

export const metadata: Metadata = { title: "MK part" };

/** One MK part: its details, stock actions and every movement it has had. */
export default async function MkPartPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await props.params;

  let part;
  try {
    part = await staff.part(id);
  } catch (error) {
    if (error instanceof BackendError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
  const history = await staff.history(id);
  const canEdit = can(user, "mkstock:write");

  const facts: [string, string][] = [
    ["Part number", part.partNo],
    ["Robot model", part.robotModel ?? "—"],
    ["Minimum level", part.minLevel > 0 ? `${num(part.minLevel)} ${part.unit}` : "No warning"],
    ["Location", part.location ?? "—"],
    ["Last movement", mkDay(part.lastMovementOn)],
    ["Note", part.note ?? "—"],
  ];

  return (
    <>
      <PageHeader
        eyebrow="MK spare parts"
        title={part.name}
        trail={[{ label: "MK spare parts", href: "/mk-stock" }, { label: "Stock list", href: "/mk-stock/parts" }, { label: part.partNo }]}
      >
        {canEdit ? (
          <>
            <MkMoveStock part={part} />
            <MkPartForm part={part} />
          </>
        ) : null}
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Panel>
          <PanelBody>
            <MkPartPhoto src={mkPhotoSrc(part, "staff")} name={part.name} className="mb-4 aspect-4/3 h-auto w-full" />
            <p className="text-[0.8125rem] text-muted">On hand</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tabular-nums">{num(part.quantityOnHand)}</span>
              <span className="text-muted">{part.unit}</span>
            </p>
            <div className="mt-2"><MkStatusBadge status={part.status} /></div>
            {!part.active ? <p className="mt-2 text-[0.75rem] text-muted">Retired - no stock can move until it is back in use.</p> : null}
            <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[0.8125rem]">
              {facts.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle icon={<History size={15} aria-hidden />} hint="Newest first. Rows are never edited - a mistake is fixed with a correction.">
              History
            </PanelTitle>
          </PanelHeader>
          {history.length === 0 ? (
            <EmptyState title="No movements yet" />
          ) : (
            <PanelFlush>
              <MovementTable rows={history} showPart={false} />
            </PanelFlush>
          )}
        </Panel>
      </div>
    </>
  );
}
