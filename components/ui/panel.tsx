import type { ComponentProps, ReactNode } from "react";

import { cx } from "@/lib/format";

/**
 * The one surface this product uses. Flat, no outline, a faint shadow —
 * depth is reserved for things that float above the page (dialogs, menus).
 */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cx(
        "rounded-lg bg-surface overflow-hidden shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeader({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      className={cx(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

export function PanelTitle({
  eyebrow,
  hint,
  icon,
  children,
}: {
  /** Taxonomy or section number — encodes what this panel is, not decoration. */
  eyebrow?: string;
  /** One line saying what the panel is for. */
  hint?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
      <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold leading-tight">
        {icon ? <span className="text-[var(--brand-ink)]">{icon}</span> : null}
        {children}
      </h2>
      {hint ? <p className="mt-1 text-[0.8125rem] text-muted">{hint}</p> : null}
    </div>
  );
}

export function PanelActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cx("flex shrink-0 items-center gap-2", className)} {...props} />
  );
}

export function PanelBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("px-4 py-4 sm:px-5", className)} {...props} />;
}

/** Body variant for content that is a table or list and supplies its own
 *  padding — keeps rows flush with the panel edge. */
export function PanelFlush({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("overflow-x-auto", className)} {...props} />;
}

export function PanelFooter({ className, ...props }: ComponentProps<"footer">) {
  return (
    <footer
      className={cx(
        "flex flex-wrap items-center justify-between gap-3 border-t border-line bg-subtle px-4 py-3 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

/** Page-level section heading, used above a group of panels. */
export function SectionHeading({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        {hint ? <p className="mt-1 text-[0.8125rem] text-muted">{hint}</p> : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-faint">{icon}</div> : null}
      <p className="text-sm font-semibold">{title}</p>
      {children ? (
        <p className="mt-1.5 max-w-sm text-[0.8125rem] text-muted">{children}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
