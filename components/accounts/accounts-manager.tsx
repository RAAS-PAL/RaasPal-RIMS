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
  resetUserPinAction,
  setUserActiveAction,
  updateUserRolesAction,
} from "@/lib/actions";
import { WAREHOUSES } from "@/lib/catalog";
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
                <Field
                  label="Username"
                  htmlFor="new-username"
                  hint="Lowercase, 3–24 characters. This is what they type to sign in."
                  required
                >
                  <TextInput
                    id="new-username"
                    name="username"
                    required
                    autoCapitalize="none"
                    spellCheck={false}
                    pattern="[a-zA-Z0-9._-]{3,24}"
                    className="font-mono"
                  />
                </Field>
                <Field label="Email" htmlFor="new-email" required>
                  <TextInput id="new-email" name="email" type="email" required />
                </Field>
                <Field label="Home site" htmlFor="new-warehouse">
                  <Select id="new-warehouse" name="warehouse" defaultValue={WAREHOUSES[0].code}>
                    {WAREHOUSES.map((site) => (
                      <option key={site.code} value={site.code}>
                        {site.code} · {site.name}
                      </option>
                    ))}
                  </Select>
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
                <Field
                  label="Six-digit PIN"
                  htmlFor="new-pin"
                  hint="They will type this to confirm every change they save."
                  required
                >
                  <TextInput
                    id="new-pin"
                    name="new_pin"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    autoComplete="off"
                    className="font-mono tracking-[0.3em]"
                  />
                </Field>
              </div>

              <Fieldset
                legend="Roles"
                hint="Choose every role this person needs. Permissions are the union."
                className="mt-4"
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  {ROLES.map((role) => (
                    <CheckboxRow
                      key={role}
                      name="roles"
                      value={role}
                      defaultChecked={role === "viewer"}
                      label={ROLE_LABEL[role]}
                      description={ROLE_DESCRIPTION[role]}
                    />
                  ))}
                </div>
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
              <div className="rounded-lg border border-line bg-surface p-4">
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
                <div className="rounded-lg border border-line bg-surface p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[0.8125rem] font-semibold">
                    <KeyRound size={14} aria-hidden className="text-muted" />
                    Reset PIN
                  </p>
                  <AuthorizedForm
                    action={resetUserPinAction}
                    intent={`Set a new confirmation PIN for ${account.name}`}
                    detail={`${account.name} · ${account.username}`}
                    submitLabel="Set new PIN"
                  >
                    <input type="hidden" name="user_id" value={account.id} />
                    <Field
                      label="New six-digit PIN"
                      htmlFor={`pin-${account.id}`}
                      hint="Tell them in person. PINs are never sent by email."
                      required
                    >
                      <TextInput
                        id={`pin-${account.id}`}
                        name="new_pin"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        required
                        autoComplete="off"
                        className="font-mono tracking-[0.3em]"
                      />
                    </Field>
                  </AuthorizedForm>
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
