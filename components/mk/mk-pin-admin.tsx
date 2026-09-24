"use client";

import { Copy, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { disableMkAccessAction, setMkPinAction } from "@/lib/mk-actions";

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
