import { PackageOpen } from "lucide-react";
import type { Metadata } from "next";

import { mkPhotoSrc } from "@/components/mk/mk-bits";
import { MkStockFilters, MkStockTable, filterParts } from "@/components/mk/mk-stock-table";
import { MkViewerShell } from "@/components/mk/mk-viewer-shell";
import { EmptyState, Panel, PanelFlush } from "@/components/ui/panel";
import { viewer } from "@/lib/mk-stock";
import { asMkViewer } from "@/lib/mk-viewer";

export const metadata: Metadata = { title: "Stock list" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** MK's read-only stock list. */
export default async function MkViewerStockPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await props.searchParams;
  const q = one(params.q);
  const status = one(params.status);
  const all = await asMkViewer(() => viewer.parts());
  const parts = filterParts(all, q, status);

  return (
    <MkViewerShell active="stock">
      <h1 className="mb-4 text-[1.5rem] font-semibold tracking-[-0.01em]">Stock list</h1>
      <MkStockFilters basePath="/mk/stock" q={q} status={status} count={parts.length} />
      <Panel>
        {parts.length === 0 ? (
          <EmptyState icon={<PackageOpen size={26} aria-hidden />} title={all.length === 0 ? "No parts recorded yet" : "Nothing matches"} />
        ) : (
          <PanelFlush>
            <MkStockTable parts={parts} partHref={(id) => `/mk/stock/${id}`} photoSrc={(p) => mkPhotoSrc(p, "mk")} />
          </PanelFlush>
        )}
      </Panel>
    </MkViewerShell>
  );
}
