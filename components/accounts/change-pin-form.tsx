"use client";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useActionState } from "react";

import { changePinAction } from "@/lib/actions";
import { IDLE } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

/** The one change that does not open the PIN dialog — the current PIN typed
 *  into the form is itself the confirmation. */
export function ChangePinForm() {
  const [state, action, pending] = useActionState(changePinAction, IDLE);

  return (
    <form action={action} className="space-y-4">
      {state.status !== "idle" ? (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 ${
            state.status === "error"
              ? "border-[var(--crit-dot)]/40 bg-crit-wash"
              : "border-[var(--ok-dot)]/40 bg-ok-wash"
          }`}
        >
          {state.status === "error" ? (
            <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0 text-crit-ink" />
          ) : (
            <CheckCircle2 size={15} aria-hidden className="mt-0.5 shrink-0 text-ok-ink" />
          )}
          <p
            className={`text-[0.8125rem] ${
              state.status === "error" ? "text-crit-ink" : "text-ok-ink"
            }`}
          >
            {state.message}
          </p>
        </div>
      ) : null}

      <Field label="Current PIN" htmlFor="current_pin" required>
        <TextInput
          id="current_pin"
          name="current_pin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          required
          autoComplete="off"
          className="font-mono tracking-[0.3em]"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="New PIN"
          htmlFor="next_pin"
          hint="Exactly six digits."
          required
        >
          <TextInput
            id="next_pin"
            name="next_pin"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            autoComplete="off"
            className="font-mono tracking-[0.3em]"
          />
        </Field>
        <Field label="Repeat new PIN" htmlFor="confirm_pin" required>
          <TextInput
            id="confirm_pin"
            name="confirm_pin"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            autoComplete="off"
            className="font-mono tracking-[0.3em]"
          />
        </Field>
      </div>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? (
          <>
            <Loader2 size={15} className="animate-spin" aria-hidden />
            Saving
          </>
        ) : (
          "Change PIN"
        )}
      </Button>
    </form>
  );
}
