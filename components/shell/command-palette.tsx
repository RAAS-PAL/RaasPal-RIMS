"use client";

import {
  Boxes,
  CornerDownLeft,
  History,
  LayoutDashboard,
  Search,
  Users,
  Warehouse,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { BackendRobotType } from "@/lib/backend-types";
import { cx, num } from "@/lib/format";

/** A robot the warehouse holds, trimmed to what search needs. */
export interface RobotIndexEntry {
  id: string;
  /** "Gausium Phantas v1.3" — already assembled server-side. */
  name: string;
  robotType: BackendRobotType;
  quantity: number;
}

interface Destination {
  href: string;
  label: string;
  context: string;
  trailing?: string;
  icon: typeof Search;
}

const PAGES: Destination[] = [
  { href: "/", label: "Dashboard", context: "Overview", icon: LayoutDashboard },
  { href: "/robots", label: "Robot catalogue", context: "Overview", icon: Boxes },
  { href: "/inventory", label: "Inventory", context: "Overview", icon: Warehouse },
  { href: "/activity", label: "Activity log", context: "Overview", icon: History },
  { href: "/accounts", label: "Accounts", context: "Overview", icon: Users },
];

/**
 * Ranks a match: a prefix beats a substring.
 *
 * <p>One field now instead of two. `name` is the assembled display name — brand,
 * model and version together — so searching "phantas" or "gausium" or "v1.3" all
 * hit it, and the separate model-id field that used to exist has nothing left to add.
 */
function score(query: string, entry: { name: string }): number {
  const q = query.toLowerCase();
  const name = entry.name.toLowerCase();
  if (name.startsWith(q)) return 0;
  if (name.includes(q)) return 2;
  return -1;
}

/**
 * Keyboard-first navigation. Operators who use this all day should never have
 * to reach for the mouse to open a robot they already know the name of.
 */
export function CommandPalette({ robots }: { robots: RobotIndexEntry[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!open && dialog.open) {
      dialog.close();
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        pages: PAGES,
        matches: robots.slice(0, 6),
      };
    }
    const pages = PAGES.filter((page) =>
      page.label.toLowerCase().includes(trimmed.toLowerCase()),
    );
    const matches = robots
      .map((robot) => ({ robot, rank: score(trimmed, robot) }))
      .filter((entry) => entry.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.robot.name.localeCompare(b.robot.name))
      .slice(0, 8)
      .map((entry) => entry.robot);
    return { pages, matches };
  }, [query, robots]);

  const flat = useMemo(
    () => [
      ...results.pages.map((page) => page.href),
      ...results.matches.map((robot) => `/robots/${robot.id}`),
    ],
    [results],
  );

  function search(next: string) {
    setQuery(next);
    setCursor(0);
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(
          "group flex h-9 w-full max-w-md cursor-pointer items-center gap-2 rounded-md",
          "border border-line-strong bg-surface px-3 text-left text-sm text-faint",
          "transition-colors duration-150 hover:border-[var(--fg-subtle)] hover:text-muted",
        )}
      >
        <Search size={15} aria-hidden className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">Search robots, models, pages</span>
        <kbd className="hidden shrink-0 rounded border border-line-strong bg-inset px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted sm:block">
          Ctrl K
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        aria-label="Search"
        className={cx(
          "mx-auto mt-[12vh] w-[min(38rem,calc(100vw-2rem))] rounded-xl border border-line",
          "bg-surface p-0 text-fg shadow-[var(--shadow-pop)] backdrop:bg-transparent",
        )}
      >
        {open ? (
          <div onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setCursor((c) => Math.min(c + 1, flat.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            }
            if (event.key === "Enter" && flat[cursor]) {
              event.preventDefault();
              go(flat[cursor]);
            }
          }}>
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              <Search size={17} aria-hidden className="shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => search(event.target.value)}
                placeholder="Search robots, models, pages"
                aria-label="Search robots, models and pages"
                className="h-13 min-w-0 flex-1 bg-transparent py-4 text-[0.9375rem] outline-none placeholder:text-faint"
              />
              <kbd className="shrink-0 rounded border border-line-strong bg-inset px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted">
                Esc
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {flat.length === 0 ? (
                <p className="px-3 py-8 text-center text-[0.8125rem] text-muted">
                  Nothing matches “{query}”.
                </p>
              ) : null}

              {results.pages.length > 0 ? (
                <Group title="Go to">
                  {results.pages.map((page, index) => (
                    <Row
                      key={page.href}
                      active={cursor === index}
                      onSelect={() => go(page.href)}
                      onHover={() => setCursor(index)}
                      icon={<page.icon size={15} aria-hidden />}
                      label={page.label}
                      context={page.context}
                    />
                  ))}
                </Group>
              ) : null}

              {results.matches.length > 0 ? (
                <Group title={query.trim() ? "Robots" : "Recently updated"}>
                  {results.matches.map((robot, index) => {
                    const position = results.pages.length + index;
                    return (
                      <Row
                        key={robot.id}
                        active={cursor === position}
                        onSelect={() => go(`/robots/${robot.id}`)}
                        onHover={() => setCursor(position)}
                        icon={
                          <span className="font-mono text-[0.625rem] font-semibold">
                            {robot.name.slice(0, 2).toUpperCase()}
                          </span>
                        }
                        label={robot.name}
                        context={
                          robot.robotType.charAt(0) + robot.robotType.slice(1).toLowerCase()
                        }
                        trailing={`${num(robot.quantity)} held`}
                      />
                    );
                  })}
                </Group>
              ) : null}
            </div>

            <footer className="flex items-center gap-4 border-t border-line bg-subtle px-4 py-2 text-[0.6875rem] text-muted">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft size={12} aria-hidden /> open
              </span>
              <span>↑ ↓ move</span>
              <span>Esc close</span>
            </footer>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="eyebrow px-3 pb-1.5 pt-2">{title}</p>
      <ul>{children}</ul>
    </div>
  );
}

function Row({
  active,
  onSelect,
  onHover,
  icon,
  label,
  context,
  trailing,
}: {
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
  icon: React.ReactNode;
  label: string;
  context: string;
  trailing?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        onMouseMove={onHover}
        className={cx(
          "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-100",
          active ? "bg-brand-wash text-fg" : "text-fg hover:bg-inset",
        )}
      >
        <span
          className={cx(
            "flex size-7 shrink-0 items-center justify-center rounded border",
            active
              ? "border-[var(--brand-600)]/40 bg-surface text-[var(--brand-ink)]"
              : "border-line bg-inset text-muted",
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium">
          {label}
        </span>
        {trailing ? (
          <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-muted">
            {trailing}
          </span>
        ) : null}
        <span className="shrink-0 text-[0.6875rem] text-faint">{context}</span>
      </button>
    </li>
  );
}
