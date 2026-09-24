import type { Metadata } from "next";

import { MkDashboardView } from "@/components/mk/mk-dashboard";
import { MkPeriod } from "@/components/mk/mk-period";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { isoDay, staff } from "@/lib/mk-stock";

export const metadata: Metadata = { title: "MK spare parts" };

/** MK spare parts, for RAAS PAL staff: stock in and out, what is used most, and what is running low. */
export default async function MkStockDashboardPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const params = await props.searchParams;
  const data = await staff.dashboard({ from: isoDay(params.from), to: isoDay(params.to) });

  return (
    <>
      <PageHeader
        eyebrow="MK spare parts"
        title="Dashboard"
        description="The spare parts RAAS PAL keeps for MK - separate from our own stock. MK sees the same figures, read-only, on their PIN page."
        trail={[{ label: "Dashboard", href: "/" }, { label: "MK spare parts" }]}
      />
      <div className="mb-5">
        <MkPeriod basePath="/mk-stock" from={data.from} to={data.to} />
      </div>
      <MkDashboardView data={data} stockHref="/mk-stock/parts" partHref={(id) => `/mk-stock/parts/${id}`} />
    </>
  );
}
