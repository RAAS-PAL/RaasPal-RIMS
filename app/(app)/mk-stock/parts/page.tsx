import { PackagePlus } from "lucide-react";
import type { Metadata } from "next";

import { mkPhotoSrc } from "@/components/mk/mk-bits";
import { MkMoveStock } from "@/components/mk/mk-move-stock";
import { MkPartForm } from "@/components/mk/mk-part-form";
import { MkStockFilters, MkStockTable, filterParts } from "@/components/mk/mk-stock-table";
import { EmptyState, Panel, PanelFlush } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { staff } from "@/lib/mk-stock";
import { can } from "@/lib/rbac";

export const metadata: Metadata = { title: "MK stock list" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Every MK part and its stock, with stock in / out on each row. */
export default async function MkStockListPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const params = await props.searchParams;
  const q = one(params.q);
  const status = one(params.status);
  const showRetired = one(params.retired) === "1";

  const all = await staff.parts(showRetired);
  const parts = filterParts(all, q, status);
  const canEdit = can(user, "mkstock:write");

  return (
    <>
      <PageHeader
        eyebrow="MK spare parts"
        title="Stock list"
        description="A count changes only by recording stock in, stock out or a correction - every stock out needs a reason."
        trail={[{ label: "MK spare parts", href: "/mk-stock" }, { label: "Stock list" }]}
      >
        <a href={showRetired ? "/mk-stock/parts" : "/mk-stock/parts?retired=1"} className="text-[0.8125rem] text-muted underline-offset-2 hover:underline">
          {showRetired ? "Hide retired parts" : "Show retired parts"}
        </a>
        {canEdit ? <MkPartForm /> : null}
      </PageHeader>

      <MkStockFilters basePath="/mk-stock/parts" q={q} status={status} count={parts.length} />

      <Panel>
        {parts.length === 0 ? (
          <EmptyState icon={<PackagePlus size={26} aria-hidden />} title={all.length === 0 ? "No MK parts yet" : "Nothing matches those filters"}>
            {all.length === 0 ? "Add MK's spare parts with their opening stock, and they appear here." : "Clear the search or the status filter."}
          </EmptyState>
        ) : (
          <PanelFlush>
            <MkStockTable
              parts={parts}
              partHref={(id) => `/mk-stock/parts/${id}`}
              photoSrc={(p) => mkPhotoSrc(p, "staff")}
              actions={
                canEdit
                  ? (p) => (
                      <>
                        <MkMoveStock part={p} compact />
                        <MkPartForm part={p} compact />
                      </>
                    )
                  : undefined
              }
            />
          </PanelFlush>
        )}
      </Panel>
    </>
  );
}
