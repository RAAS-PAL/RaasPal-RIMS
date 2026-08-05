import type { ComponentProps, ReactNode } from "react";

import { cx } from "@/lib/format";

const CONTROL =
  "w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-fg " +
  "placeholder:text-faint transition-colors duration-150 " +
  "hover:border-[var(--fg-subtle)] focus:border-[var(--focus)] " +
  "disabled:cursor-not-allowed disabled:bg-inset disabled:text-muted " +
  "read-only:bg-subtle read-only:text-muted";

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(CONTROL, "h-9", className)} {...props} />;
}

/** Numeric entry for counts and prices — right-aligned mono so digits line up
 *  with the figures they are editing. */
export function NumberInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      inputMode="numeric"
      className={cx(CONTROL, "h-9 text-right font-mono tabular-nums", className)}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cx(CONTROL, "min-h-24 py-2 leading-relaxed", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cx(CONTROL, "h-9 cursor-pointer pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  /** Persistent helper text — never a placeholder standing in for a label. */
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const hintId = hint && htmlFor ? `${htmlFor}-hint` : undefined;
  return (
    <div className={cx("min-w-0", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-center gap-1 text-[0.8125rem] font-medium text-fg"
      >
        {label}
        {required ? (
          <span className="text-[var(--crit-ink)]" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-[0.75rem] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Fieldset({
  legend,
  hint,
  children,
  className,
}: {
  legend: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className="mb-1 text-[0.8125rem] font-medium text-fg">{legend}</legend>
      {hint ? <p className="mb-2.5 text-[0.75rem] text-muted">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

export function CheckboxRow({
  label,
  description,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string }) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-start gap-2.5 rounded-md border border-line px-3 py-2.5",
        "transition-colors duration-150 hover:bg-inset has-checked:border-[var(--brand-600)] has-checked:bg-brand-wash",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--brand-solid)]"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-medium text-fg">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[0.75rem] text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
