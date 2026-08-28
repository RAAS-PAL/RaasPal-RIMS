"use client";

import { AlertTriangle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { IDLE } from "@/lib/action-state";
import { changePasswordAction } from "@/lib/actions";

/**
 * Change your own password.
 *
 * <p>The current password is required even though you are already signed in. A live
 * session proves the browser authenticated at some point, not that the account owner
 * is the person at the keyboard — an unattended desk is exactly the case it guards.
 *
 * <p>Cleared on success rather than left filled: a form still showing the password
 * you just set is both a shoulder-surfing risk and an invitation to submit twice.
 */
export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {state.status === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-[var(--crit-dot)]/40 bg-crit-wash px-3 py-2.5"
        >
          <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-crit-ink" />
          <p className="text-[0.8125rem] text-crit-ink">{state.message}</p>
        </div>
      ) : null}

      {state.status === "ok" ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-md border border-line bg-inset px-3 py-2.5"
        >
          <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0" />
          <p className="text-[0.8125rem]">{state.message}</p>
        </div>
      ) : null}

      <Field label="Current password" htmlFor="currentPassword" required>
        <TextInput
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Field
        label="New password"
        htmlFor="newPassword"
        hint="At least 8 characters."
        required
      >
        <TextInput
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <Field label="Confirm new password" htmlFor="confirmPassword" required>
        <TextInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <Button type="submit" variant="primary" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden />
            Changing…
          </>
        ) : (
          <>
            <KeyRound size={15} aria-hidden />
            Change password
          </>
        )}
      </Button>
    </form>
  );
}
