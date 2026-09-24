import { KeyRound, ShieldCheck, Warehouse } from "lucide-react";
import type { Metadata } from "next";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { RoleBadges } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { warehouseName } from "@/lib/catalog";
import { initials } from "@/lib/format";
import { CAPABILITIES, ROLE_DESCRIPTION, ROLE_LABEL, can, sortRoles } from "@/lib/rbac";

export const metadata: Metadata = { title: "Your account" };

const CAPABILITY_LABEL: Record<(typeof CAPABILITIES)[number], string> = {
  "catalog:read": "Read the catalogue and inventory",
  "content:write": "Edit specifications and descriptions",
  "media:write": "Edit photographs and brochures",
  "price:write": "Change buy-off prices",
  "stock:write": "Change stock counts",
  "users:manage": "Manage accounts and roles",
  "mkstock:write": "Record MK spare parts stock",
  "mkstock:pin": "Set MK's view PIN",
};

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title={user.name}
        description="What you are allowed to change, and the PIN you use to confirm it."
        trail={[{ label: "Dashboard", href: "/" }, { label: "Your account" }]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="space-y-5">
          <Panel>
            <PanelHeader>
              <PanelTitle
                eyebrow="Identity"
                icon={<ShieldCheck size={16} aria-hidden />}
              >
                Profile
              </PanelTitle>
            </PanelHeader>
            <PanelBody>
              <div className="flex items-start gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--brand-solid)] font-mono text-lg font-semibold text-[var(--brand-on-solid)]">
                  {initials(user.name)}
                </span>
                <dl className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <Row label="Name" value={user.name} />
                  <Row label="Username" value={user.username} mono />
                  <Row label="Email" value={user.email} />
                  <div className="min-w-0">
                    <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                      Home site
                    </dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-[0.875rem]">
                      <Warehouse size={14} aria-hidden className="text-muted" />
                      {warehouseName(user.warehouse)}
                      <span className="font-mono text-[0.6875rem] text-muted">
                        {user.warehouse}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <p className="text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                  Roles
                </p>
                <div className="mt-2">
                  <RoleBadges roles={user.roles} />
                </div>
                <ul className="mt-3 space-y-1.5">
                  {sortRoles(user.roles).map((role) => (
                    <li key={role} className="text-[0.8125rem] text-muted">
                      <span className="font-medium text-fg">{ROLE_LABEL[role]}</span> —{" "}
                      {ROLE_DESCRIPTION[role]}
                    </li>
                  ))}
                </ul>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle
                eyebrow="Permissions"
                hint="What the roles above add up to."
                icon={<ShieldCheck size={16} aria-hidden />}
              >
                What you can do
              </PanelTitle>
            </PanelHeader>
            <PanelBody>
              <ul className="grid gap-2 sm:grid-cols-2">
                {CAPABILITIES.map((capability) => {
                  const allowed = can(user, capability);
                  return (
                    <li
                      key={capability}
                      className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-[0.8125rem] ${
                        allowed
                          ? "border-[var(--ok-dot)]/35 bg-ok-wash text-ok-ink"
                          : "border-line bg-subtle text-muted"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`size-1.5 shrink-0 rounded-full ${
                          allowed ? "bg-[var(--ok-dot)]" : "bg-[var(--fg-subtle)]"
                        }`}
                      />
                      <span className="min-w-0 flex-1">{CAPABILITY_LABEL[capability]}</span>
                      <span className="shrink-0 text-[0.6875rem] font-medium">
                        {allowed ? "Allowed" : "No"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </PanelBody>
          </Panel>
        </div>

        <Panel className="lg:sticky lg:top-20 lg:self-start">
          <PanelHeader>
            <PanelTitle
              eyebrow="Security"
              hint="Managed by the RAASPAL platform."
              icon={<KeyRound size={16} aria-hidden />}
            >
              Sign-in
            </PanelTitle>
          </PanelHeader>
          <PanelBody>
            <p className="text-[0.8rem] leading-relaxed text-muted">
              Your account is the same one you use across the RAASPAL platform. Every
              change you save is checked against your role on the server.
            </p>

            <div className="mt-5 border-t border-line pt-5">
              <ChangePasswordForm />
            </div>

            <p className="mt-5 border-t border-line pt-4 text-[0.75rem] leading-relaxed text-muted">
              Changing your password here changes it everywhere you sign in with this
              account. If you are locked out and cannot sign in at all, ask a RAASPAL
              administrator.
            </p>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
        {label}
      </dt>
      <dd className={`mt-1 truncate text-[0.875rem] ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
