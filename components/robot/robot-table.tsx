import Link from "next/link";

import { CATEGORY_META } from "@/lib/catalog";
import { baht, num, since } from "@/lib/format";
import type { Robot } from "@/lib/types";
import { summarizeStock } from "@/lib/types";
import { DemoChip, StockBadge } from "@/components/ui/badge";
import { StockMeter } from "@/components/ui/stock-meter";
import { RobotImage } from "./robot-image";

/** The dense read of the same catalogue — one row per model, sortable columns
 *  of figures, for when you are comparing rather than browsing. */
export function RobotTable({ robots, now }: { robots: Robot[]; now: number }) {
  return (
    <table className="w-full min-w-[54rem] text-left text-[0.8125rem]">
      <thead>
        <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
          <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
            Robot
          </th>
          <th scope="col" className="px-3 py-2.5 font-medium">
            Category
          </th>
          <th scope="col" className="min-w-44 px-3 py-2.5 font-medium">
            Stock position
          </th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">
            On hand
          </th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">
            Available
          </th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">
            Buy-off
          </th>
          <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">
            Updated
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--line)]">
        {robots.map((robot) => {
          const stock = summarizeStock(robot);
          return (
            <tr key={robot.slug} className="group hover:bg-subtle">
              <th scope="row" className="px-4 py-2.5 font-normal sm:px-5">
                <div className="flex items-center gap-3">
                  <RobotImage
                    name={robot.name}
                    category={robot.category}
                    src={robot.image}
                    size="row"
                    className="size-11 shrink-0 rounded-md border border-line"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/robots/${robot.slug}`}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {robot.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-[0.6875rem] text-muted">
                      {robot.modelId}
                    </p>
                  </div>
                </div>
              </th>
              <td className="px-3 py-2.5 text-muted">
                {CATEGORY_META[robot.category].label}
              </td>
              <td className="px-3 py-2.5">
                <StockMeter robot={robot} density="compact" />
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <StockBadge state={stock.state} />
                  <DemoChip count={stock.demo} />
                </div>
              </td>
              <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">
                {num(stock.onHand)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted">
                {num(stock.available)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                {baht(robot.buyOff)}
              </td>
              <td className="px-4 py-2.5 text-right text-[0.75rem] text-muted sm:px-5">
                {since(robot.updatedAt, now)}
                <span className="mt-0.5 block text-[0.6875rem] text-faint">
                  {robot.updatedBy}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
