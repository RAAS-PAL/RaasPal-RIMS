import { History, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { DemoChip, StockBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { ROBOT_TYPE_LABELS, type RobotStockEntryResponse } from "@/lib/backend-types";
import { num, stamp } from "@/lib/format";
import { RobotImage } from "./robot-image";

/**
 * What the record says about one robot, before anything is changed.
 *
 * <p>The edit page used to open straight onto a form. A form is a poor way to read
 * a record: the values are inside inputs, the photo is behind a file picker, and
 * nothing states what the row currently holds. This panel answers "what am I looking
 * at" so the form below it can be about changing things.
 */
export function RobotSummary({ entry }: { entry: RobotStockEntryResponse }) {
  const demo = entry.status === "DEMO";

  return (
    <Panel>
      <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,16rem)_1fr]">
        <RobotImage
          name={entry.displayName}
          robotType={entry.robotType}
          src={entry.imageUrl}
          className="aspect-4/3 rounded-lg border border-line"
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {entry.quantity === 0 ? (
              <StockBadge state="out-of-stock" />
            ) : demo ? (
              <DemoChip count={entry.quantity} />
            ) : (
              <StockBadge state="in-stock" count={entry.quantity} />
            )}
            {entry.location ? (
              <span className="inline-flex items-center gap-1 text-[0.75rem] text-muted">
                <MapPin size={12} aria-hidden />
                {entry.location}
              </span>
            ) : null}
          </div>

          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="text-[1.75rem] font-semibold leading-none tracking-[-0.02em]">
              {num(entry.quantity)}
            </span>
            <span className="text-[0.8125rem] font-medium text-faint">
              {entry.quantity === 1 ? "unit" : "units"} · {demo ? "Demo" : "In stock"}
            </span>
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
            <Fact label="Type">{ROBOT_TYPE_LABELS[entry.robotType]}</Fact>
            <Fact label="Brand">{entry.brand}</Fact>
            <Fact label="Model">{entry.model}</Fact>
            <Fact label="Version">{entry.version ?? "—"}</Fact>
            <Fact label="Last updated" span>
              {stamp(entry.updatedAt)}
            </Fact>
            {entry.note ? (
              <Fact label="Note" span>
                {entry.note}
              </Fact>
            ) : null}
          </dl>

          {/* The one piece of history this table keeps. Shown here rather than only as
              a hint under the quantity field, because it is the undo path for the
              commonest warehouse slip — typing 3 where 30 was meant. */}
          {entry.previousQuantity != null ? (
            <p className="mt-4 flex items-start gap-2 rounded-md bg-inset px-3 py-2.5 text-[0.75rem] text-muted">
              <History size={13} aria-hidden className="mt-0.5 shrink-0" />
              <span>
                Previously{" "}
                <span className="font-mono font-semibold text-fg">
                  {num(entry.previousQuantity)}
                </span>
                {entry.previousQuantityAt ? ` · changed ${stamp(entry.previousQuantityAt)}` : ""}.
                Only the last count is kept.
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function Fact({
  label,
  children,
  span,
}: {
  label: string;
  children: ReactNode;
  /** Full width, for values that do not fit a half column. */
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2 min-w-0" : "min-w-0"}>
      <dt className="text-[0.6875rem] uppercase tracking-[0.08em] text-faint">{label}</dt>
      <dd className="mt-0.5 text-[0.8125rem] font-medium">{children}</dd>
    </div>
  );
}
