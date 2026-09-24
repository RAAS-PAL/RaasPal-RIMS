import { KeyRound, Link2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { CopyLink, MkDisableAccess, MkSetPin } from "@/components/mk/mk-pin-admin";
import { Chip } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { stamp } from "@/lib/format";
import { staff } from "@/lib/mk-stock";
import { can } from "@/lib/rbac";

export const metadata: Metadata = { title: "MK access" };

/** The link MK uses, and the PIN that opens it. */
export default async function MkAccessPage() {
  const user = await requireUser();
  const status = await staff.access();
  // Always the RIMS domain, whatever address staff opened RIMS on (a Vercel preview, localhost).
  const link = `${(process.env.RIMS_PUBLIC_URL ?? "https://rims.raaspal.com").replace(/\/+$/, "")}/mk`;
  const isAdmin = can(user, "mkstock:pin");

  return (
    <>
      <PageHeader
        eyebrow="MK spare parts"
        title="MK access"
        description="MK staff open their own link and enter a PIN we give them. They can see the dashboard and the stock list, and cannot change anything."
        trail={[{ label: "MK spare parts", href: "/mk-stock" }, { label: "MK access" }]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader><PanelTitle icon={<Link2 size={15} aria-hidden />}>Link for MK</PanelTitle></PanelHeader>
          <PanelBody className="space-y-4">
            <CopyLink url={link} />
            <dl className="space-y-2 text-[0.8125rem]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd>{status.pinSet ? <Chip tone="ok">On - PIN set</Chip> : <Chip tone="warn">Off - no PIN</Chip>}</dd>
              </div>
              {status.pinSet ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">PIN set</dt>
                    <dd>{status.pinCreatedAt ? stamp(status.pinCreatedAt) : "—"} · {status.pinCreatedBy}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Last used by MK</dt>
                    <dd>{status.lastUsedAt ? stamp(status.lastUsedAt) : "Not yet"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Signed in now</dt>
                    <dd>{status.activeSessions} {status.activeSessions === 1 ? "session" : "sessions"}</dd>
                  </div>
                </>
              ) : null}
            </dl>
            <p className="flex items-start gap-2 rounded-md bg-inset px-3 py-2 text-[0.75rem] text-muted">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden />
              A session lasts 12 hours. Five wrong PINs lock that device out for 15 minutes. Changing the PIN signs everyone out.
            </p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle icon={<KeyRound size={15} aria-hidden />}>{status.pinSet ? "Change the PIN" : "Set a PIN"}</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-5">
            {isAdmin ? (
              <>
                <MkSetPin hasPin={status.pinSet} />
                {status.pinSet ? (
                  <div className="border-t border-line pt-4">
                    <MkDisableAccess />
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-[0.8125rem] text-muted">Only an admin can set or change MK&apos;s PIN.</p>
            )}
            <p className="text-[0.75rem] text-muted">
              We only keep a scrambled copy of the PIN, so it cannot be shown again. Write it down when you set it and send it to MK
              separately from the link.
            </p>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
