"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { CheckboxRow, Fieldset, TextInput } from "@/components/ui/field";
import type { RobotStockEntryResponse } from "@/lib/backend-types";

/**
 * Which robots a part fits.
 *
 * <p>A checkbox group rather than a dropdown, because the answer is genuinely
 * several robots — one filter fits both the M50 and the M75 — and a multi-select
 * hides what is already ticked behind a click.
 *
 * <p>Filtering happens in the browser over a list the server already sent. With
 * around ninety robots that is nothing, and it keeps typing responsive without a
 * round trip per keystroke. The filter never hides a ticked robot: narrowing the
 * search would otherwise appear to silently unlink one, and submitting would then
 * do exactly that.
 */
export function RobotLinksField({
  robots,
  selectedIds = [],
}: {
  robots: RobotStockEntryResponse[];
  /** Ticked on load — the part's existing links when editing. */
  selectedIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return robots;
    return robots.filter(
      (r) => r.displayName.toLowerCase().includes(q) || selected.has(r.id),
    );
  }, [robots, query, selected]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Fieldset
      legend="Fits these robots"
      hint={
        selected.size === 0
          ? "Leave all unticked for a universal item such as detergent."
          : `${selected.size} selected. Unticking removes the link when you save.`
      }
    >
      <div className="relative mb-2">
        <Search
          size={14}
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
        />
        <TextInput
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter robots…"
          aria-label="Filter robots"
          className="pl-8"
        />
      </div>

      <div className="grid max-h-64 gap-1.5 overflow-y-auto pr-0.5">
        {visible.length === 0 ? (
          <p className="px-1 py-3 text-[0.8125rem] text-muted">No robot matches that.</p>
        ) : (
          visible.map((robot) => (
            <CheckboxRow
              key={robot.id}
              // The name repeats per ticked box; the server action reads them
              // with getAll, so every tick survives the submit.
              name="robotStockIds"
              value={robot.id}
              checked={selected.has(robot.id)}
              onChange={() => toggle(robot.id)}
              label={robot.displayName}
              description={robot.location ?? undefined}
            />
          ))
        )}
      </div>
    </Fieldset>
  );
}
