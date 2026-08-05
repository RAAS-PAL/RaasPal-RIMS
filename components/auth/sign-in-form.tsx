"use client";

import { AlertTriangle, Loader2, LogIn } from "lucide-react";
import { useActionState } from "react";

import { signInAction } from "@/lib/actions";
import { IDLE } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, IDLE);

  return (
    <form action={action} className="space-y-4">
      {state.status === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-[var(--crit-dot)]/40 bg-crit-wash px-3 py-2.5"
        >
          <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-crit-ink" />
          <p className="text-[0.8125rem] text-crit-ink">{state.message}</p>
        </div>
      ) : null}

      <Field label="Username" htmlFor="username" required>
        <TextInput
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          placeholder="your work username"
        />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden />
            Signing in
          </>
        ) : (
          <>
            <LogIn size={16} aria-hidden />
            Sign in
          </>
        )}
      </Button>
    </form>
  );
}
