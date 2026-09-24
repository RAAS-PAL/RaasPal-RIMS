import { BarChart3, ClipboardList, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Mark } from "@/components/brand";
import { cx } from "@/lib/format";
import { mkSignOutAction } from "@/lib/mk-actions";

/** Header and tabs for MK's read-only pages. */
export function MkViewerShell({ active, children }: { active: "dashboard" | "stock"; children: ReactNode }) {
  const tabs = [
    { key: "dashboard", href: "/mk/dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "stock", href: "/mk/stock", label: "Stock list", icon: ClipboardList },
  ] as const;
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Mark className="size-8" />
            <div className="leading-tight">
              <p className="text-[0.9375rem] font-semibold">MK spare parts</p>
              <p className="text-[0.6875rem] text-muted">Held by RAAS PAL · view only</p>
            </div>
          </div>
          <nav className="flex gap-1" aria-label="MK pages">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium",
                  active === t.key ? "bg-brand-wash text-brand-ink" : "text-muted hover:bg-inset hover:text-fg",
                )}
              >
                <t.icon size={15} aria-hidden /> {t.label}
              </Link>
            ))}
          </nav>
          <form action={mkSignOutAction} className="ml-auto">
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8125rem] text-muted hover:bg-inset hover:text-fg">
              <LogOut size={15} aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}
