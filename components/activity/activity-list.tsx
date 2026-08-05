import {
  Bookmark,
  CircleDollarSign,
  FileText,
  FlaskConical,
  ImageIcon,
  PackageMinus,
  PackagePlus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { cx, since, stamp } from "@/lib/format";
import type { ActivityEntry, ActivityKind } from "@/lib/types";

const PRESENTATION: Record<
  ActivityKind,
  { icon: typeof FileText; tint: string; word: string }
> = {
  restock: { icon: PackagePlus, tint: "text-ok-ink bg-ok-wash", word: "Stock" },
  demo: { icon: FlaskConical, tint: "text-demo-ink bg-demo-wash", word: "Demo" },
  price: {
    icon: CircleDollarSign,
    tint: "text-[var(--brand-ink)] bg-brand-wash",
    word: "Price",
  },
  reserve: { icon: Bookmark, tint: "text-muted bg-inset", word: "Reserved" },
  media: { icon: ImageIcon, tint: "text-muted bg-inset", word: "Media" },
  content: { icon: FileText, tint: "text-muted bg-inset", word: "Details" },
  created: { icon: Sparkles, tint: "text-muted bg-inset", word: "Catalogue" },
};

export function ActivityList({
  entries,
  now,
  showRobot = true,
}: {
  entries: ActivityEntry[];
  /** A fixed clock passed from the server so relative times do not drift. */
  now: number;
  showRobot?: boolean;
}) {
  return (
    <ul className="divide-y divide-[var(--line)]">
      {entries.map((entry) => {
        const { icon: Icon, tint, word } = PRESENTATION[entry.kind];
        const removed = typeof entry.delta === "number" && entry.delta < 0;
        const Glyph = entry.kind === "restock" && removed ? PackageMinus : Icon;

        return (
          <li key={entry.id} className="flex gap-3 px-4 py-3 sm:px-5">
            <span
              className={cx(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                removed && entry.kind === "restock" ? "bg-crit-wash text-crit-ink" : tint,
              )}
              title={word}
            >
              <Glyph size={14} aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[0.8125rem] leading-snug">
                {showRobot ? (
                  <>
                    <Link
                      href={`/robots/${entry.robotSlug}`}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {entry.robotName}
                    </Link>
                    <span className="text-faint"> · </span>
                  </>
                ) : null}
                <span className="text-muted">{entry.summary}</span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6875rem] text-faint">
                <span>{entry.by}</span>
                <span aria-hidden>·</span>
                <time dateTime={entry.at} title={stamp(entry.at)}>
                  {since(entry.at, now)}
                </time>
              </p>
            </div>

            {typeof entry.delta === "number" && entry.delta !== 0 ? (
              <span
                className={cx(
                  "shrink-0 self-start font-mono text-[0.75rem] font-semibold tabular-nums",
                  entry.delta > 0 ? "text-ok-ink" : "text-crit-ink",
                )}
              >
                {entry.delta > 0 ? "+" : "−"}
                {Math.abs(entry.delta)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
