import { CATEGORY_ORDER } from "./catalog";
import type { ActivityEntry, CategoryId, Robot, StockState } from "./types";
import { summarizeStock } from "./types";

export interface FleetTotals {
  skus: number;
  onHand: number;
  demo: number;
  reserved: number;
  available: number;
  /** Buy-off value of everything sellable on the shelf, in THB. */
  stockValue: number;
  lowStock: number;
  outOfStock: number;
  /** Net sellable units gained or lost over the window. */
  netUnits7d: number;
  netDemo7d: number;
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function fleetTotals(
  robots: Robot[],
  activity: ActivityEntry[],
  now = Date.now(),
): FleetTotals {
  const totals: FleetTotals = {
    skus: robots.length,
    onHand: 0,
    demo: 0,
    reserved: 0,
    available: 0,
    stockValue: 0,
    lowStock: 0,
    outOfStock: 0,
    netUnits7d: 0,
    netDemo7d: 0,
  };

  for (const robot of robots) {
    const stock = summarizeStock(robot);
    totals.onHand += stock.onHand;
    totals.demo += stock.demo;
    totals.reserved += stock.reserved;
    totals.available += stock.available;
    totals.stockValue += stock.onHand * robot.buyOff;
    if (stock.state === "low-stock") totals.lowStock += 1;
    if (stock.state === "out-of-stock") totals.outOfStock += 1;
  }

  const cutoff = now - WEEK;
  for (const entry of activity) {
    if (typeof entry.delta !== "number") continue;
    if (new Date(entry.at).getTime() < cutoff) continue;
    if (entry.kind === "restock") totals.netUnits7d += entry.delta;
    if (entry.kind === "demo") totals.netDemo7d += entry.delta;
  }

  return totals;
}

export interface CategoryRollup {
  id: CategoryId;
  skus: number;
  onHand: number;
  demo: number;
  reserved: number;
  needsAttention: number;
  stockValue: number;
}

export function categoryRollups(robots: Robot[]): CategoryRollup[] {
  return CATEGORY_ORDER.map((id) => {
    const members = robots.filter((robot) => robot.category === id);
    const rollup: CategoryRollup = {
      id,
      skus: members.length,
      onHand: 0,
      demo: 0,
      reserved: 0,
      needsAttention: 0,
      stockValue: 0,
    };
    for (const robot of members) {
      const stock = summarizeStock(robot);
      rollup.onHand += stock.onHand;
      rollup.demo += stock.demo;
      rollup.reserved += stock.reserved;
      rollup.stockValue += stock.onHand * robot.buyOff;
      if (stock.state !== "in-stock") rollup.needsAttention += 1;
    }
    return rollup;
  }).filter((rollup) => rollup.skus > 0);
}

/** Out of stock first, then closest to the reorder point — the order someone
 *  working a restock list would want. */
export function restockQueue(robots: Robot[]): Robot[] {
  const weight: Record<StockState, number> = {
    "out-of-stock": 0,
    "low-stock": 1,
    "in-stock": 2,
  };
  return robots
    .filter((robot) => summarizeStock(robot).state !== "in-stock")
    .sort((a, b) => {
      const stockA = summarizeStock(a);
      const stockB = summarizeStock(b);
      const byState = weight[stockA.state] - weight[stockB.state];
      if (byState !== 0) return byState;
      const gapA = a.reorderPoint - stockA.onHand;
      const gapB = b.reorderPoint - stockB.onHand;
      if (gapA !== gapB) return gapB - gapA;
      return b.buyOff - a.buyOff;
    });
}

/** Units committed to signed orders that the shelf cannot currently cover. */
export function oversoldRobots(robots: Robot[]): Robot[] {
  return robots.filter((robot) => {
    const { onHand, reserved } = summarizeStock(robot);
    return reserved > onHand;
  });
}
