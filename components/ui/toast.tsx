"use client";

import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cx } from "@/lib/format";

type ToastTone = "ok" | "error";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  show: (message: string, tone: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = use(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>.");
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { id, tone, message }]);
      /* Errors stay long enough to read and act on; confirmations get out of the way. */
      window.setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={api}>
      {children}
      {/* Announced, but never steals focus from what the operator is doing. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((toast) => (
          <output
            key={toast.id}
            className={cx(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-3.5 py-3",
              "bg-surface shadow-[var(--shadow-pop)] motion-safe:animate-[toast-in_180ms_ease-out]",
              toast.tone === "ok"
                ? "border-[var(--ok-dot)]/40"
                : "border-[var(--crit-dot)]/50",
            )}
          >
            <span
              className={cx(
                "mt-0.5 shrink-0",
                toast.tone === "ok" ? "text-ok-ink" : "text-crit-ink",
              )}
            >
              {toast.tone === "ok" ? (
                <CheckCircle2 size={16} aria-hidden />
              ) : (
                <AlertTriangle size={16} aria-hidden />
              )}
            </span>
            <p className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-fg">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded p-1 text-faint transition-colors hover:bg-inset hover:text-fg"
            >
              <X size={14} aria-hidden />
            </button>
          </output>
        ))}
      </div>
    </ToastContext>
  );
}
