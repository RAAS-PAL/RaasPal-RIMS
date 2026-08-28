"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { RobotStockEntryResponse } from "@/lib/backend-types";
import { num } from "@/lib/format";

import { RobotCard } from "./robot-card";

/** Cards drawn before the first scroll — a couple of rows past the fold on a wide screen. */
const FIRST_BATCH = 24;

/** Added each time the sentinel comes into view. */
const NEXT_BATCH = 24;

/**
 * A grid of robot cards that grows as you scroll.
 *
 * <p>The whole list is already in the page — it arrives in one 29 KB response, and
 * photos are fetched separately per card. So this is not paging over the network; it
 * limits how many cards exist in the DOM at once, which is what actually made the
 * page slow to paint once 92 entries were on it.
 *
 * <p>Growing on scroll rather than on a page number because the warehouse reads this
 * list looking for one robot, and losing your place at a page boundary is worse than
 * scrolling. Combined with lazily-loaded photos, only what you actually reach is
 * fetched.
 *
 * <p>A visible button sits alongside the observer. It is what the observer triggers,
 * so if IntersectionObserver is unavailable — or a zoom level or short viewport means
 * the sentinel never intersects — the list is still reachable by clicking.
 */
export function RobotGrid({
  robots,
  canWrite,
}: {
  robots: RobotStockEntryResponse[];
  canWrite: boolean;
}) {
  const [visible, setVisible] = useState(FIRST_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const shown = robots.slice(0, visible);
  const remaining = robots.length - shown.length;

  useEffect(() => {
    if (remaining <= 0) return;
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((count) => count + NEXT_BATCH);
        }
      },
      // Start loading before the sentinel is actually on screen, so the next rows are
      // already drawn by the time they are scrolled to.
      { rootMargin: "600px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [remaining]);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3.5">
        {shown.map((robot) => (
          <RobotCard key={robot.id} entry={robot} canWrite={canWrite} />
        ))}
      </div>

      {remaining > 0 ? (
        <div ref={sentinelRef} className="mt-4 flex flex-col items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setVisible((count) => count + NEXT_BATCH)}
          >
            Show more
          </Button>
          <p className="text-[0.75rem] text-muted">
            Showing {num(shown.length)} of {num(robots.length)}
          </p>
        </div>
      ) : null}
    </>
  );
}
