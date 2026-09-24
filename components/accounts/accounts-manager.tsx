"use client";

import {
  KeyRound,
  ShieldOff,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  createUserAction,
  setUserActiveAction,
  updateUserRolesAction,
} from "@/lib/actions";
import { cx, day, since } from "@/lib/format";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/rbac";
import { ROLES, type Role } from "@/lib/types";
import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Chip, RoleBadges } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxRow, Field, Fieldset, Select, TextInput } from "@/components/ui/field";
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelFlush,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";

export interface AccountRow {
  id: string;
  username: string;
  name: string;
  email: string;
  roles: Role[];
  warehouse: string;
  active: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

export function AccountsManager({
  accounts,
  currentUserId,
  now,
}: {
  accounts: AccountRow[];
  currentUserId: string;
  now: number;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-5">
      <Panel>
        <PanelHeader>
          <PanelTitle
            eyebrow="Access"
            hint="An account can hold several roles at once and is granted the sum of them."
            icon={<ShieldCheck size={16} aria-hidden />}
          >
            Accounts
          </PanelTitle>
          <PanelActions>
            <Button
              variant={creating ? "ghost" : "primary"}
              size="sm"
              onClick={() => setCreating((current) => !current)}
              aria-expanded={creating}
            >
              {creating ? <X size={14} aria-hidden /> : <UserPlus size={14} aria-hidden />}
              {creating ? "Cancel" : "Add account"}
            </Button>
          </PanelActions>
        </PanelHeader>

        {creating ? (
          <PanelBody className="border-b border-line bg-subtle">
            <AuthorizedForm
              action={createUserAction}
              intent="Create a new account with the roles selected"
              detail="New RIMS account"
              submitLabel="Create account"
              onDone={() => setCreating(false)}
              onCancel={() => setCreating(false)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="new-name" required>
                  <TextInput id="new-name" name="name" required maxLength={80} />
                </Field>
                {/* Email is the sign-in identity — the platform has no username, and
                    no per-user home site now that stock is tracked per unit. */}
                <Field
                  label="Email"
                  htmlFor="new-email"
                  hint="This is what they sign in with, across the whole platform."
                  required
                >
                  <TextInput id="new-email" name="email" type="email" required />
                </Field>
                <Field
                  label="Temporary password"
                  htmlFor="new-password"
                  hint="At least 10 characters. Hand it over in person and ask them to change it."
                  required
                >
                  <TextInput
                    id="new-password"
                    name="password"
                    type="text"
                    minLength={10}
                    required
                    autoComplete="off"
                  />
                </Field>
              </div>

              {/* One role, not several. The platform stores a single role per
                  account, so checkboxes would collapse silently on save — better to
                  make the choice exclusive than to accept input that cannot be kept. */}
              <Fieldset legend="Role" hint="What this person is allowed to do." className="mt-4">
                <Select name="roles" defaultValue="viewer" aria-label="Role">
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]} — {ROLE_DESCRIPTION[role]}
                    </option>
                  ))}
                </Select>
              </Fieldset>
            </AuthorizedForm>
          </PanelBody>
        ) : null}

        <PanelFlush>
          <table className="w-full min-w-[48rem] text-left text-[0.8125rem]">
            <thead>
              <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
                  Person
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Roles
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Home site
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Last signed in
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">
                  Manage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {accounts.map((account) => (
                <AccountRowView
                  key={account.id}
                  account={account}
                  isSelf={account.id === currentUserId}
                  now={now}
                />
              ))}
            </tbody>
          </table>
        </PanelFlush>
      </Panel>
    </div>
  );
}

function AccountRowView({
  account,
  isSelf,
  now,
}: {
  account: AccountRow;
  isSelf: boolean;
  now: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className={cx("align-top hover:bg-subtle", open && "bg-subtle")}>
        <th scope="row" className="px-4 py-3 font-normal sm:px-5">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{account.name}</span>
            {isSelf ? <Chip tone="brand">You</Chip> : null}
            {!account.active ? <Chip tone="crit">Deactivated</Chip> : null}
          </p>
          <p className="mt-0.5 font-mono text-[0.6875rem] text-muted">
            {account.username}
          </p>
          <p className="mt-0.5 text-[0.6875rem] text-faint">{account.email}</p>
        </th>
        <td className="px-3 py-3">
          <RoleBadges roles={account.roles} />
        </td>
        <td className="px-3 py-3 font-mono text-[0.75rem] text-muted">
          {account.warehouse}
        </td>
        <td className="px-3 py-3 text-[0.75rem] text-muted">
          {account.lastSignInAt ? (
            since(account.lastSignInAt, now)
          ) : (
            <span className="text-faint">Never</span>
          )}
          <span className="mt-0.5 block text-[0.6875rem] text-faint">
            Added {day(account.createdAt)}
          </span>
        </td>
        <td className="px-4 py-3 text-right sm:px-5">
          <Button
            variant={open ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
          >
            {open ? <X size={14} aria-hidden /> : <SlidersHorizontal size={14} aria-hidden />}
            {open ? "Close" : "Manage"}
          </Button>
        </td>
      </tr>

      {open ? (
        <tr className="bg-subtle">
          <td colSpan={5} className="px-4 pb-4 sm:px-5">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg bg-surface shadow-[var(--shadow-card)] p-4">
                <p className="mb-3 text-[0.8125rem] font-semibold">
                  Roles for {account.name}
                </p>
                <AuthorizedForm
                  action={updateUserRolesAction}
                  intent={`Change what ${account.name} is allowed to do`}
                  detail={`${account.name} · ${account.username}`}
                  submitLabel="Save roles"
                  onDone={() => setOpen(false)}
                >
                  <input type="hidden" name="user_id" value={account.id} />
                  <div className="space-y-2">
                    {ROLES.map((role) => (
                      <CheckboxRow
                        key={role}
                        name="roles"
                        value={role}
                        defaultChecked={account.roles.includes(role)}
                        label={ROLE_LABEL[role]}
                        description={ROLE_DESCRIPTION[role]}
                      />
                    ))}
                  </div>
                </AuthorizedForm>
              </div>

              <div className="space-y-3">
                {/* Passwords and any reset flow belong to the RAASPAL platform, which
                    owns identity now. RIMS holds no credential it could reset. */}
                <div className="rounded-lg bg-surface shadow-[var(--shadow-card)] p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[0.8125rem] font-semibold">
                    <KeyRound size={14} aria-hidden className="text-muted" />
                    Password
                  </p>
                  <p className="text-[0.75rem] leading-relaxed text-muted">
                    Held by the RAASPAL platform, not here. If {account.name} is locked
                    out, deactivate the account below or ask a platform administrator to
                    issue a new password.
                  </p>
                </div>

                <div
                  className={cx(
                    "rounded-lg border bg-surface p-4",
                    account.active ? "border-[var(--crit-dot)]/35" : "border-line",
                  )}
                >
                  <p className="mb-1 flex items-center gap-1.5 text-[0.8125rem] font-semibold">
                    <ShieldOff size={14} aria-hidden className="text-muted" />
                    {account.active ? "Deactivate account" : "Restore account"}
                  </p>
                  <p className="mb-3 text-[0.75rem] text-muted">
                    {account.active
                      ? "Signs them out and blocks sign-in. Their entries stay in the activity log."
                      : "Lets them sign in again with their existing password and PIN."}
                  </p>
                  {isSelf ? (
                    <p className="rounded-md border border-line bg-inset px-3 py-2 text-[0.75rem] text-muted">
                      You cannot deactivate your own account. Ask another admin.
                    </p>
                  ) : (
                    <AuthorizedForm
                      action={setUserActiveAction}
                      intent={`${account.active ? "Deactivate" : "Restore"} ${account.name}`}
                      detail={`${account.name} · ${account.username}`}
                      submitLabel={account.active ? "Deactivate" : "Restore"}
                    >
                      <input type="hidden" name="user_id" value={account.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={account.active ? "false" : "true"}
                      />
                    </AuthorizedForm>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
