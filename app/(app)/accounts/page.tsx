import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

import { AccountsManager, type AccountRow } from "@/components/accounts/accounts-manager";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { listUsers, requireUser } from "@/lib/auth";
import { readClock } from "@/lib/clock";
import { ROLE_DESCRIPTION, ROLE_LABEL, can } from "@/lib/rbac";
import { ROLES } from "@/lib/types";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const user = await requireUser();

  if (!can(user, "users:manage")) {
    return (
      <>
        <PageHeader
          eyebrow="Access"
          title="Accounts"
          trail={[{ label: "Dashboard", href: "/" }, { label: "Accounts" }]}
        />
        <Panel>
          <EmptyState
            icon={<ShieldAlert size={26} aria-hidden />}
            title="Managing accounts needs the Admin role"
            action={
              <ButtonLink href="/account" variant="secondary" size="sm">
                Go to your own account
              </ButtonLink>
            }
          >
            Your account holds the {user.roles.map((role) => ROLE_LABEL[role]).join(" and ")}{" "}
            role. Ask an admin if you need to add someone or change what they can do.
          </EmptyState>
        </Panel>
      </>
    );
  }

  const records = await listUsers();
  const accounts: AccountRow[] = records
    .map((record) => ({
      id: record.id,
      username: record.username,
      name: record.name,
      email: record.email,
      roles: record.roles,
      warehouse: record.warehouse,
      active: record.active,
      createdAt: record.createdAt,
      lastSignInAt: record.lastSignInAt,
    }))
    .sort(
      (a, b) =>
        Number(b.active) - Number(a.active) || a.name.localeCompare(b.name),
    );

  return (
    <>
      <PageHeader
        eyebrow="Access"
        title="Accounts"
        description="Who can sign in, and what each of them is allowed to change. Every action on this page is confirmed with your own PIN."
        trail={[{ label: "Dashboard", href: "/" }, { label: "Accounts" }]}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {ROLES.map((role) => (
          <div key={role} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-[0.875rem] font-semibold">{ROLE_LABEL[role]}</p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
              {ROLE_DESCRIPTION[role]}
            </p>
            <p className="mt-2.5 border-t border-line pt-2.5 font-mono text-[0.6875rem] text-faint">
              {accounts.filter((account) => account.roles.includes(role)).length} account
              {accounts.filter((account) => account.roles.includes(role)).length === 1
                ? ""
                : "s"}
            </p>
          </div>
        ))}
      </div>

      <AccountsManager
        accounts={accounts}
        currentUserId={user.id}
        now={await readClock()}
      />
    </>
  );
}
