"use client";

import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { IDLE, type ActionState } from "@/lib/action-state";
import { cx } from "@/lib/format";
import { Button } from "./button";
import { useToast } from "./toast";

type ServerAction = (
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/**
 * Every write in this system goes through here.
 *
 * Pressing Save does not save: it opens a confirmation naming exactly what is about
 * to change and to which record, and only that releases it.
 *
 * The PIN this dialog used to demand is gone. Identity now belongs to the RAASPAL
 * platform, and every write is checked server-side against a signed token and the
 * account's role — a boundary the browser cannot argue with, which a PIN typed into
 * this dialog never was. What remains is the part that was always doing the real
 * work: a deliberate pause that states the change in words before it happens.
 */
export function AuthorizedForm({
  action,
  intent,
  detail,
  submitLabel = "Save changes",
  onDone,
  onCancel,
  children,
  className,
}: {
  action: ServerAction;
  /** What is about to happen, e.g. "Update stock at three sites". */
  intent: string;
  /** Which record it happens to, e.g. "Beetle · BEETLE". */
  detail: string;
  submitLabel?: string;
  onDone?: () => void;
  onCancel?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const [state, dispatch, pending] = useActionState(action, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (state.status === "ok") {
      closeDialog();
      toast.show(state.message, "ok");
      onDone?.();
    }
    // On failure the dialog stays open with the message shown, so the edit behind it
    // is never lost to a rejected save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function openDialog() {
    setOpen(true);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Focus the confirm button, not the form behind it — the dialog is the step.
    window.requestAnimationFrame(() => confirmRef.current?.focus());
  }

  function closeDialog() {
    setOpen(false);
    dialogRef.current?.close();
  }

  function confirm() {
    const form = formRef.current;
    if (!form) return;
    startTransition(() => dispatch(new FormData(form)));
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        openDialog();
      }}
      className={className}
    >
      {children}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="primary" disabled={pending}>
          <ShieldCheck size={15} aria-hidden />
          {submitLabel}
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          if (!pending) closeDialog();
        }}
        aria-labelledby="confirm-title"
        className={cx(
          "m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-line",
          "bg-surface p-0 text-fg shadow-[var(--shadow-pop)] backdrop:bg-transparent",
        )}
      >
        {open ? (
          <div className="p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-wash text-[var(--brand-ink)]">
                <KeyRound size={17} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-[0.9375rem] font-semibold leading-tight">
                  Confirm this change
                </h2>
                <p className="mt-1 text-[0.8125rem] text-muted">
                  {intent}
                </p>
                <p className="mt-0.5 truncate font-mono text-[0.75rem] text-faint">
                  {detail}
                </p>
              </div>
            </div>

            <div className="mt-4">
              {state.status === "error" ? (
                <p
                  id="confirm-error"
                  role="alert"
                  className="mt-2 text-[0.8125rem] font-medium text-crit-ink"
                >
                  {state.message}
                </p>
              ) : (
                <p id="confirm-hint" className="mt-2 text-[0.75rem] text-muted">
                  This change is recorded against your name in the activity log.
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={closeDialog} disabled={pending}>
                Cancel
              </Button>
              <Button ref={confirmRef} variant="primary" onClick={confirm} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden />
                    Saving
                  </>
                ) : (
                  "Confirm change"
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </form>
  );
}
