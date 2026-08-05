import Link from "next/link";
import type { ComponentProps } from "react";

import { cx } from "@/lib/format";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "whitespace-nowrap transition-colors duration-150 cursor-pointer " +
  "[touch-action:manipulation] disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-solid)] text-[var(--brand-on-solid)] hover:bg-[var(--brand-solid-hover)]",
  secondary:
    "border border-line-strong bg-surface text-fg hover:bg-inset hover:border-[var(--fg-subtle)]",
  ghost: "text-muted hover:bg-inset hover:text-fg",
  danger:
    "border border-[var(--crit-dot)] bg-[var(--crit-wash)] text-[var(--crit-ink)] hover:bg-[var(--crit-dot)] hover:text-white",
  link: "text-[var(--brand-ink)] underline-offset-4 hover:underline px-0",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-[0.8125rem]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-sm",
};

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function buttonClass({ variant = "secondary", size = "md" }: StyleProps) {
  return cx(BASE, VARIANTS[variant], variant === "link" ? "h-auto" : SIZES[size]);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return (
    <button
      type={type}
      className={cx(buttonClass({ variant, size }), className)}
      {...props}
    />
  );
}

/** Navigation that looks like a button. Separate component rather than an
 *  `as` prop so the href is type-checked against the route map. */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return (
    <Link className={cx(buttonClass({ variant, size }), className)} {...props} />
  );
}

/** Square control for a single icon. Always needs an accessible name. */
export function IconButton({
  label,
  variant = "ghost",
  className,
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "aria-label"> & {
  label: string;
  variant?: ButtonVariant;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        BASE,
        VARIANTS[variant],
        "size-9 shrink-0 p-0",
        className,
      )}
      {...props}
    />
  );
}
