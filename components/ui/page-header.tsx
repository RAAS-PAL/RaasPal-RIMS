import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-[0.75rem] text-muted">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight size={12} aria-hidden className="text-faint" />
              ) : null}
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="rounded transition-colors hover:text-fg hover:underline underline-offset-2"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="text-fg">
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  trail,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  trail?: Crumb[];
  /** Page-level actions, right-aligned. */
  children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {trail ? <Breadcrumbs trail={trail} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
          <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.015em]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[0.875rem] leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
        ) : null}
      </div>
    </header>
  );
}
