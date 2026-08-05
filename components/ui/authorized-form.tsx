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
 * Pressing Save does not save. It opens a confirmation that asks the signed-in
 * person for their PIN, and only a correct PIN releases the change — so each
 * line in the activity log is one someone put their own credential behind.
 * The PIN is verified on the server inside the action, never here.
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
  const pinRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (state.status === "ok") {
      closeDialog();
      toast.show(state.message, "ok");
      onDone?.();
    }
    if (state.status === "error") {
      /* Stay on the dialog so the PIN can be retyped without losing the edit. */
      pinRef.current?.select();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function openDialog() {
    setOpen(true);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    window.requestAnimationFrame(() => pinRef.current?.focus());
  }

  function closeDialog() {
    setOpen(false);
    if (pinRef.current) pinRef.current.value = "";
    dialogRef.current?.close();
  }

  function confirm() {
    const form = formRef.current;
    if (!form) return;
    const pin = pinRef.current?.value ?? "";
    if (pin.length < 4) {
      pinRef.current?.focus();
      return;
    }
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
                  Confirm with your PIN
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
              <label
                htmlFor="confirm-pin"
                className="mb-1.5 block text-[0.8125rem] font-medium"
              >
                Your six-digit PIN
              </label>
              <input
                ref={pinRef}
                id="confirm-pin"
                name="pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={12}
                placeholder="••••••"
                aria-describedby={
                  state.status === "error" ? "confirm-error" : "confirm-hint"
                }
                aria-invalid={state.status === "error"}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    confirm();
                  }
                }}
                className={cx(
                  "h-11 w-full rounded-md border bg-surface px-3 text-center font-mono text-lg tracking-[0.5em]",
                  "transition-colors duration-150 placeholder:tracking-[0.5em] placeholder:text-faint",
                  state.status === "error"
                    ? "border-[var(--crit-dot)]"
                    : "border-line-strong focus:border-[var(--focus)]",
                )}
              />
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
              <Button variant="primary" onClick={confirm} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden />
                    Confirming
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
