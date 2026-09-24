import type { Metadata } from "next";

import { MkDashboardView } from "@/components/mk/mk-dashboard";
import { MkPeriod } from "@/components/mk/mk-period";
import { MkViewerShell } from "@/components/mk/mk-viewer-shell";
import { isoDay, viewer } from "@/lib/mk-stock";
import { asMkViewer } from "@/lib/mk-viewer";

export const metadata: Metadata = { title: "Dashboard" };

/** MK's read-only dashboard - the same figures RAAS PAL sees, without who recorded each movement. */
export default async function MkViewerDashboardPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await props.searchParams;
  const data = await asMkViewer(() => viewer.dashboard({ from: isoDay(params.from), to: isoDay(params.to) }));
  return (
    <MkViewerShell active="dashboard">
      <h1 className="mb-4 text-[1.5rem] font-semibold tracking-[-0.01em]">Spare parts overview</h1>
      <div className="mb-5">
        <MkPeriod basePath="/mk/dashboard" from={data.from} to={data.to} />
      </div>
      <MkDashboardView data={data} stockHref="/mk/stock" partHref={(id) => `/mk/stock/${id}`} />
    </MkViewerShell>
  );
}
