"use client";

import { Copy, Loader2, PowerOff, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { disableMkAccessAction, resetMkPinAction, setMkPinAction, type PinResetState } from "@/lib/mk-actions";

/** Set (or change) MK's PIN. Changing it ends every MK session. */
export function MkSetPin({ hasPin }: { hasPin: boolean }) {
  const router = useRouter();
  return (
    <AuthorizedForm
      action={setMkPinAction}
      intent={hasPin ? "Change MK's PIN - everyone at MK must enter the new one" : "Turn on MK's view with this PIN"}
      detail="MK stock view"
      submitLabel={hasPin ? "Change PIN" : "Set PIN"}
      onDone={() => router.refresh()}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={hasPin ? "New PIN" : "PIN"} htmlFor="mk-pin" required hint="6 to 12 digits. Not all the same digit, not 123456.">
          <TextInput id="mk-pin" name="pin" type="password" inputMode="numeric" pattern="\d{6,12}" minLength={6} maxLength={12} required autoComplete="new-password" />
        </Field>
        <Field label="Type it again" htmlFor="mk-pin-confirm" required>
          <TextInput id="mk-pin-confirm" name="confirm" type="password" inputMode="numeric" pattern="\d{6,12}" minLength={6} maxLength={12} required autoComplete="new-password" />
        </Field>
      </div>
    </AuthorizedForm>
  );
}

export function MkDisableAccess() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <PowerOff size={14} aria-hidden /> Turn off MK access
      </Button>
    );
  }
  return (
    <AuthorizedForm
      action={disableMkAccessAction}
      intent="Turn off MK's view - the PIN stops working and everyone at MK is signed out"
      detail="MK stock view"
      submitLabel="Turn off"
      onDone={() => {
        setOpen(false);
        router.refresh();
      }}
      onCancel={() => setOpen(false)}
    >
      <p className="text-[0.8125rem] text-muted">MK will not be able to open the stock page until a new PIN is set.</p>
    </AuthorizedForm>
  );
}

export function CopyLink({ url }: { url: string }) {
  const toast = useToast();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-md border border-line bg-inset px-3 py-1.5 font-mono text-[0.8125rem]">{url}</code>
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            toast.show("Link copied", "ok");
          } catch {
            toast.show("Copy did not work - select the link instead", "error");
          }
        }}
      >
        <Copy size={14} aria-hidden /> Copy
      </Button>
    </div>
  );
}

/**
 * One-click reset: a new random 6-digit PIN, shown here once to copy and send to MK. The old
 * PIN stops working and everyone at MK is signed out.
 */
export function MkResetPin({ hasPin }: { hasPin: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<PinResetState | null>(null);
  const [pending, start] = useTransition();

  function reset() {
    start(async () => {
      const r = await resetMkPinAction();
      setResult(r);
      setConfirming(false);
      if (r.status === "ok") router.refresh();
    });
  }

  if (result?.status === "ok" && result.pin) {
    return (
      <div className="rounded-lg bg-brand-wash p-4">
        <p className="text-[0.8125rem] font-medium text-fg">New PIN for MK</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="font-mono text-2xl font-semibold tracking-[0.3em] text-brand-ink">{result.pin}</span>
          <CopyValue value={result.pin} label="PIN copied" />
        </div>
        <p className="mt-2 text-[0.75rem] text-muted">
          Shown this once - copy it now and send it to MK. The old PIN no longer works and everyone at MK has been signed out.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-inset p-3">
          <p className="min-w-0 flex-1 text-[0.8125rem] text-fg">
            {hasPin ? "Make a new PIN? The current one stops working and everyone at MK is signed out." : "Make a PIN for MK now?"}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={reset} disabled={pending}>
            {pending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RotateCcw size={14} aria-hidden />}
            {hasPin ? "Reset PIN" : "Make PIN"}
          </Button>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
          <RotateCcw size={14} aria-hidden /> {hasPin ? "Reset PIN" : "Make a PIN for me"}
        </Button>
      )}
      {result?.status === "error" ? <p role="alert" className="text-[0.8125rem] text-crit-ink">{result.message}</p> : null}
    </div>
  );
}

function CopyValue({ value, label }: { value: string; label: string }) {
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.show(label, "ok");
        } catch {
          toast.show("Copy did not work - select it instead", "error");
        }
      }}
    >
      <Copy size={14} aria-hidden /> Copy
    </Button>
  );
}
