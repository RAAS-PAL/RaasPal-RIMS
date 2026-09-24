import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MkPartPhoto, MkStatusBadge, MovementTable, mkDay, mkPhotoSrc } from "@/components/mk/mk-bits";
import { MkViewerShell } from "@/components/mk/mk-viewer-shell";
import { EmptyState, Panel, PanelBody, PanelFlush, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { num } from "@/lib/format";
import { viewer } from "@/lib/mk-stock";
import { asMkViewer } from "@/lib/mk-viewer";

export const metadata: Metadata = { title: "Part" };

/** One part's stock and history, read-only for MK. */
export default async function MkViewerPartPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const parts = await asMkViewer(() => viewer.parts());
  const part = parts.find((p) => p.id === id);
  if (!part) notFound();
  const history = await asMkViewer(() => viewer.history(id));

  return (
    <MkViewerShell active="stock">
      <p className="mb-2 text-[0.8125rem] text-muted">
        <Link href="/mk/stock" className="underline-offset-2 hover:underline">Stock list</Link> / {part.partNo}
      </p>
      <h1 className="mb-4 text-[1.5rem] font-semibold tracking-[-0.01em]">{part.name}</h1>
      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Panel>
          <PanelBody>
            <MkPartPhoto src={mkPhotoSrc(part, "mk")} name={part.name} className="mb-4 aspect-4/3 h-auto w-full" />
            <p className="text-[0.8125rem] text-muted">On hand</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tabular-nums">{num(part.quantityOnHand)}</span>
              <span className="text-muted">{part.unit}</span>
            </p>
            <div className="mt-2"><MkStatusBadge status={part.status} /></div>
            <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[0.8125rem]">
              {([
                ["Part number", part.partNo],
                ["Robot model", part.robotModel ?? "—"],
                ["Minimum level", part.minLevel > 0 ? `${num(part.minLevel)} ${part.unit}` : "—"],
                ["Location", part.location ?? "—"],
                ["Last movement", mkDay(part.lastMovementOn)],
              ] as const).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader><PanelTitle>History</PanelTitle></PanelHeader>
          {history.length === 0 ? (
            <EmptyState title="No movements yet" />
          ) : (
            <PanelFlush>
              <MovementTable rows={history} showPart={false} />
            </PanelFlush>
          )}
        </Panel>
      </div>
    </MkViewerShell>
  );
}
