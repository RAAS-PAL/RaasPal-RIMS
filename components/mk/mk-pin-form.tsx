"use client";

import { AlertTriangle, Loader2, LogIn } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { IDLE } from "@/lib/action-state";
import { mkSignInAction } from "@/lib/mk-actions";

/** MK staff's PIN entry. */
export function MkPinForm() {
  const [state, action, pending] = useActionState(mkSignInAction, IDLE);
  return (
    <form action={action} className="space-y-4">
      {state.status === "error" ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-md border border-[var(--crit-dot)]/40 bg-crit-wash px-3 py-2.5">
          <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-crit-ink" />
          <p className="text-[0.8125rem] text-crit-ink">{state.message}</p>
        </div>
      ) : null}
      <Field label="PIN" htmlFor="mk-view-pin" required>
        <TextInput
          id="mk-view-pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="\d{4,12}"
          maxLength={12}
          required
          autoFocus
          className="text-center font-mono text-lg tracking-[0.4em]"
        />
      </Field>
      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
        {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <LogIn size={16} aria-hidden />}
        {pending ? "Checking" : "View stock"}
      </Button>
    </form>
  );
}
