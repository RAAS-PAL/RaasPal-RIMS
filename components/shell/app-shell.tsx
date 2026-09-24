"use client";

import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ClipboardList,
  History,
  KeyRound,
  LayoutDashboard,
  Package,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Mark, Wordmark } from "@/components/brand";
import {
  ROBOT_TYPE_LABELS,
  ROBOT_TYPES,
  type BackendRobotType,
} from "@/lib/backend-types";
import { cx, initials, num } from "@/lib/format";
import { can, describeRoles } from "@/lib/rbac";
import type { SessionUser } from "@/lib/types";
import { CommandPalette, type RobotIndexEntry } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";

/** Counts are UNITS held, not rows — "Cleaning 14" means fourteen machines. */
export interface NavSummary {
  total: number;
  counts: Record<BackendRobotType, number>;
  /** Parts at or below their reorder point — the bell count. */
  attention: number;
}

const MAIN_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/robots", label: "Robot catalogue", icon: Boxes },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/activity", label: "Activity log", icon: History },
] as const;

/** MK's spare parts - kept apart from RAAS PAL's own stock. */
const MK_NAV = [
  { href: "/mk-stock", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/mk-stock/parts", label: "Stock list", icon: ClipboardList },
  { href: "/mk-stock/access", label: "MK access", icon: KeyRound },
] as const;

export function AppShell({
  user,
  nav,
  robots,
  signOut,
  children,
}: {
  user: SessionUser;
  nav: NavSummary;
  robots: RobotIndexEntry[];
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-[var(--brand-solid)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--brand-on-solid)]"
      >
        Skip to main content
      </a>

      {/* Mobile scrim */}
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-[rgb(6_14_22/0.55)] lg:hidden"
        />
      ) : null}

      <Sidebar
        user={user}
        nav={nav}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="flex min-h-dvh flex-col lg:pl-[17rem]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-app/85 px-3 backdrop-blur-md sm:px-5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-inset hover:text-fg lg:hidden"
          >
            <Menu size={18} aria-hidden />
          </button>

          <div className="flex min-w-0 flex-1 items-center">
            <CommandPalette robots={robots} />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/inventory?lowStock=true"
              aria-label={`${nav.attention} parts need restocking`}
              title={`${nav.attention} parts need restocking`}
              className="relative flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-inset hover:text-fg"
            >
              <Bell size={17} aria-hidden />
              {nav.attention > 0 ? (
                <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-[var(--crit-dot)] px-1 font-mono text-[0.625rem] font-semibold leading-4 text-white">
                  {nav.attention > 99 ? "99+" : nav.attention}
                </span>
              ) : null}
            </Link>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <UserMenu user={user} signOut={signOut} />
          </div>
        </header>

        <main id="main" className="flex-1 px-3 py-5 sm:px-5 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[86rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Sidebar({
  user,
  nav,
  open,
  onClose,
}: {
  user: SessionUser;
  nav: NavSummary;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cx(
        "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-line bg-rail text-muted",
        "transition-transform duration-200 ease-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-start justify-between gap-2 px-4 pb-4 pt-4">
        <Link
          href="/"
          className="group min-w-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-400)]"
        >
          <span className="flex items-center gap-2.5">
            <Mark className="size-[34px]" priority />
            <Wordmark className="h-[26px]" priority />
          </span>
          <span className="mt-3 block border-t border-line pt-2.5 font-display text-[0.6875rem] font-medium uppercase leading-tight tracking-[0.11em] text-muted transition-colors group-hover:text-fg">
            Robot Inventory
            <br />
            Management System
          </span>
        </Link>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="-mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-inset hover:text-fg lg:hidden"
        >
          <X size={17} aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <NavGroup title="Main menu">
          {MAIN_NAV.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon size={16} aria-hidden />}
              onNavigate={onClose}
              active={
                "exact" in item && item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
              }
            />
          ))}
          {can(user, "users:manage") ? (
            <NavItem
              href="/accounts"
              label="Accounts"
              icon={<Users size={16} aria-hidden />}
              onNavigate={onClose}
              active={pathname.startsWith("/accounts")}
            />
          ) : null}
        </NavGroup>

        <NavGroup title="Sections">
          <NavSection
            id="mk-spare-parts"
            label="MK spare parts"
            icon={<Package size={16} aria-hidden />}
            current={pathname.startsWith("/mk-stock")}
          >
            {MK_NAV.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<item.icon size={15} aria-hidden />}
                onNavigate={onClose}
                indent
                active={
                  "exact" in item && item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                }
              />
            ))}
          </NavSection>

          <NavSection
            id="robot-types"
            label="Robot types"
            icon={<Boxes size={16} aria-hidden />}
            current={pathname === "/robots"}
          >
            <Suspense fallback={null}>
              <CategoryNav nav={nav} onNavigate={onClose} />
            </Suspense>
          </NavSection>
        </NavGroup>
      </div>

      <div className="border-t border-line px-4 py-3">
        <p className="flex items-center gap-1.5 text-[0.6875rem] text-muted">
          <ShieldCheck size={12} aria-hidden />
          Signed in as {describeRoles(user.roles)}
        </p>
        <p className="mt-1 truncate text-[0.8125rem] font-medium text-fg">
          {user.name}
        </p>
      </div>
    </nav>
  );
}

/**
 * The four robot types the platform models, with the units held of each.
 *
 * <p>This replaced seven invented categories (reception, patrol, cooking, canal
 * cleaning, spider) that existed only in the seed data. A type with nothing in the
 * warehouse is hidden rather than shown at zero: the rail is for getting somewhere,
 * and four rows of "0" is just noise to read past.
 */
function CategoryNav({
  nav,
  onNavigate,
}: {
  nav: NavSummary;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const onCatalogue = pathname === "/robots";
  const active = params.get("type");

  const types = ROBOT_TYPES.filter(
    (type) => (nav.counts[type] ?? 0) > 0,
  );

  return (
    <>
      <NavItem
        href="/robots"
        label="All robots"
        icon={<Boxes size={16} aria-hidden />}
        count={nav.total}
        active={onCatalogue && !active}
        onNavigate={onNavigate}
        indent
      />
      {types.map((type) => (
        <NavItem
          key={type}
          href={`/robots?type=${type}`}
          label={ROBOT_TYPE_LABELS[type]}
          count={nav.counts[type] ?? 0}
          active={onCatalogue && active === type}
          onNavigate={onNavigate}
          indent
          deep
        />
      ))}
    </>
  );
}

function NavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="eyebrow px-2 pb-2 !text-muted">{title}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

const NAV_EVENT = "rims-nav-change";

function subscribeNav(onChange: () => void) {
  window.addEventListener(NAV_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(NAV_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readNav(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * A sidebar parent you click to open, holding its sub-pages. It opens by itself when the
 * current page is inside it, and remembers what the person opened or closed.
 */
function NavSection({
  id,
  label,
  icon,
  current,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  /** The current page is one of this section's sub-pages. */
  current: boolean;
  children: ReactNode;
}) {
  const storageKey = `rims.nav.${id}`;
  // "open" | "closed" as the person left it, or null when they have not chosen (or storage
  // is blocked) - then the section just follows the current page.
  const chosen = useSyncExternalStore(subscribeNav, () => readNav(storageKey), () => null);
  const pathname = usePathname();
  // Arriving on one of the section's pages opens it; clicking the header still closes it
  // while you stay on that page. Moving to another page opens it again.
  const [closedOn, setClosedOn] = useState<string | null>(null);
  const open = current ? closedOn !== pathname : chosen === "open";

  function toggle() {
    const next = !open;
    if (current) setClosedOn(next ? null : pathname);
    try {
      window.localStorage.setItem(storageKey, next ? "open" : "closed");
      window.dispatchEvent(new Event(NAV_EVENT));
    } catch {
      // Not remembered this time - nothing else depends on it.
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`nav-${id}`}
        className={cx(
          "flex w-full cursor-pointer items-center gap-2.5 rounded-md py-2 pl-2.5 pr-2 text-left text-[0.8125rem]",
          "transition-colors duration-150",
          current ? "font-semibold text-brand-ink" : "text-muted hover:bg-inset hover:text-fg",
        )}
      >
        <span className="shrink-0 opacity-80">{icon}</span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronDown
          size={15}
          aria-hidden
          className={cx("shrink-0 transition-transform duration-200", open ? "rotate-0" : "-rotate-90")}
        />
      </button>
      {open ? (
        <ul id={`nav-${id}`} className="mt-0.5 space-y-0.5">
          {children}
        </ul>
      ) : null}
    </li>
  );
}

function NavItem({
  href,
  label,
  icon,
  count,
  active,
  indent,
  deep,
  onNavigate,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  active: boolean;
  indent?: boolean;
  /** One level further in, e.g. a robot type under "All robots". */
  deep?: boolean;
  /** Closes the mobile drawer — following a link should leave it behind. */
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cx(
          "group relative flex items-center gap-2.5 rounded-md py-2 pr-2 text-[0.8125rem]",
          "transition-colors duration-150",
          deep ? "pl-12" : indent ? "pl-8" : "pl-2.5",
          active
            ? "bg-brand-wash font-semibold text-brand-ink"
            : "text-muted hover:bg-inset hover:text-fg",
        )}
      >
        {active ? (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--brand-500)]"
          />
        ) : null}
        {icon ? <span className="shrink-0 opacity-80">{icon}</span> : null}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {typeof count === "number" ? (
          <span
            className={cx(
              "shrink-0 rounded px-1.5 py-0.5 font-mono text-[0.6875rem] tabular-nums",
              active ? "bg-surface text-brand-ink" : "bg-inset text-muted",
            )}
          >
            {num(count)}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

/* -------------------------------------------------------------------------- */

function useDismissable(onDismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onDismiss]);
  return ref;
}

/* The "Inventory by site" menu that used to sit here is gone. It listed three
   warehouses from `lib/catalog.ts` — Bangkok, Chiang Mai, Phuket — that exist only
   in seed data, and each row linked to `/inventory?site=CODE`, a filter the parts
   table no longer supports. Nothing in the schema records which site holds what. */

function UserMenu({
  user,
  signOut,
}: {
  user: SessionUser;
  signOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable(() => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name}`}
        className="flex h-9 cursor-pointer items-center gap-2 rounded-md pl-1 pr-1.5 transition-colors hover:bg-inset"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-solid)] font-mono text-[0.6875rem] font-semibold text-[var(--brand-on-solid)]">
          {initials(user.name)}
        </span>
        <span className="hidden min-w-0 text-left lg:block">
          <span className="block truncate text-[0.8125rem] font-medium leading-tight">
            {user.name}
          </span>
          <span className="block truncate text-[0.6875rem] leading-tight text-muted">
            {describeRoles(user.roles)}
          </span>
        </span>
        <ChevronDown size={13} aria-hidden className="hidden text-faint lg:block" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-pop)]"
        >
          <div className="border-b border-line px-3 py-3">
            <p className="truncate text-[0.8125rem] font-semibold">{user.name}</p>
            <p className="truncate text-[0.75rem] text-muted">{user.email}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[0.6875rem] text-muted">
              <ShieldCheck size={12} aria-hidden />
              {describeRoles(user.roles)}
            </p>
          </div>
          <div className="p-1.5">
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-md px-2.5 py-2 text-[0.8125rem] transition-colors hover:bg-inset"
            >
              Your account and PIN
            </Link>
            <div className="mt-1 border-t border-line pt-1 sm:hidden">
              <div className="px-2.5 py-2">
                <ThemeToggle />
              </div>
            </div>
            <form action={signOut} className="mt-1 border-t border-line pt-1">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-[0.8125rem] text-crit-ink transition-colors hover:bg-crit-wash"
              >
                <LogOut size={14} aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
