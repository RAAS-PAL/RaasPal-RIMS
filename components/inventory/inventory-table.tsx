"use client";

import { Lock, Minus, PackageSearch, Plus, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { adjustStockAction } from "@/lib/actions";
import { CATEGORY_META, WAREHOUSES, warehouseName } from "@/lib/catalog";
import { cx, num, since } from "@/lib/format";
import type { Robot } from "@/lib/types";
import { summarizeStock } from "@/lib/types";
import { DemoChip, StockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthorizedForm } from "@/components/ui/authorized-form";
import { Field, NumberInput, Select, TextInput } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/panel";

const COLUMN_COUNT = 8;

export function InventoryTable({
  robots,
  canEdit,
  site,
  now,
}: {
  robots: Robot[];
  canEdit: boolean;
  /** Empty means every site rolled up. */
  site: string;
  now: number;
}) {
  if (robots.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch size={26} aria-hidden />}
        title="No robots match this view"
      >
        Widen the filters above, or switch back to all sites.
      </EmptyState>
    );
  }

  return (
    <table className="w-full min-w-[62rem] text-left text-[0.8125rem]">
      <caption className="sr-only">
        Stock levels {site ? `at ${warehouseName(site)}` : "across all sites"}
      </caption>
      <thead>
        <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
          <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
            Robot
          </th>
          <th scope="col" className="px-3 py-2.5 font-medium">
            Status
          </th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">
            On hand
          </th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">
            Reserved
          </th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">
            Available
          </th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">
            Demo
          </th>
          <th scope="col" className="px-3 py-2.5 text-right font-medium">
            Reorder at
          </th>
          <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">
            Adjust
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--line)]">
        {robots.map((robot) => (
          <InventoryRow
            key={robot.slug}
            robot={robot}
            canEdit={canEdit}
            site={site}
            now={now}
          />
        ))}
      </tbody>
    </table>
  );
}

function InventoryRow({
  robot,
  canEdit,
  site,
  now,
}: {
  robot: Robot;
  canEdit: boolean;
  site: string;
  now: number;
}) {
  const [open, setOpen] = useState(false);
  const total = summarizeStock(robot);

  /* When a single site is selected the counts shown are that site's, but the
     status badge stays on the whole-fleet position — a robot is not "out of
     stock" because one depot is empty. */
  const scoped = site
    ? robot.locations.find((location) => location.code === site) ?? {
        code: site,
        onHand: 0,
        demo: 0,
      }
    : { code: "", onHand: total.onHand, demo: total.demo };

  return (
    <>
      <tr className={cx("align-top hover:bg-subtle", open && "bg-subtle")}>
        <th scope="row" className="px-4 py-3 font-normal sm:px-5">
          <Link
            href={`/robots/${robot.slug}`}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {robot.name}
          </Link>
          <p className="mt-0.5 text-[0.6875rem] text-muted">
            {CATEGORY_META[robot.category].label} ·{" "}
            <span className="font-mono">{robot.modelId}</span>
          </p>
          <p className="mt-0.5 text-[0.6875rem] text-faint">
            {since(robot.updatedAt, now)} · {robot.updatedBy}
          </p>
        </th>
        <td className="px-3 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <StockBadge state={total.state} />
            <DemoChip count={total.demo} />
          </div>
        </td>
        <td className="px-3 py-3 text-right font-mono text-[0.875rem] font-semibold tabular-nums">
          {num(scoped.onHand)}
        </td>
        <td className="px-3 py-3 text-right font-mono tabular-nums text-muted">
          {site ? "—" : num(total.reserved)}
        </td>
        <td
          className={cx(
            "px-3 py-3 text-right font-mono tabular-nums",
            !site && total.available === 0 && "text-crit-ink",
          )}
        >
          {site ? "—" : num(total.available)}
        </td>
        <td className="px-3 py-3 text-right font-mono tabular-nums text-muted">
          {num(scoped.demo)}
        </td>
        <td className="px-3 py-3 text-right font-mono tabular-nums text-muted">
          {num(robot.reorderPoint)}
        </td>
        <td className="px-4 py-3 text-right sm:px-5">
          <Button
            variant={open ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setOpen((current) => !current)}
            disabled={!canEdit}
            aria-expanded={open}
            title={canEdit ? undefined : "Changing stock counts needs the Admin role."}
          >
            {!canEdit ? (
              <Lock size={14} aria-hidden />
            ) : open ? (
              <X size={14} aria-hidden />
            ) : (
              <SlidersHorizontal size={14} aria-hidden />
            )}
            {open ? "Close" : "Adjust"}
          </Button>
        </td>
      </tr>

      {open && canEdit ? (
        <tr className="bg-subtle">
          <td colSpan={COLUMN_COUNT} className="px-4 pb-4 sm:px-5">
            <AdjustForm
              robot={robot}
              defaultSite={site || WAREHOUSES[0].code}
              onDone={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function AdjustForm({
  robot,
  defaultSite,
  onDone,
  onCancel,
}: {
  robot: Robot;
  defaultSite: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="mb-3 text-[0.8125rem] font-semibold">
        Move units of {robot.name}
      </p>

      <AuthorizedForm
        action={adjustStockAction}
        intent={`${direction === "add" ? "Add" : "Remove"} ${quantity} ${quantity === 1 ? "unit" : "units"} of ${robot.name}`}
        detail={`${robot.name} · ${robot.modelId}`}
        submitLabel="Record movement"
        onDone={onDone}
        onCancel={onCancel}
      >
        <input type="hidden" name="slug" value={robot.slug} />
        <input
          type="hidden"
          name="delta"
          value={direction === "add" ? quantity : -quantity}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Site" htmlFor={`site-${robot.slug}`}>
            <Select id={`site-${robot.slug}`} name="code" defaultValue={defaultSite}>
              {WAREHOUSES.map((site) => (
                <option key={site.code} value={site.code}>
                  {site.code} · {site.city}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Stock type" htmlFor={`field-${robot.slug}`}>
            <Select id={`field-${robot.slug}`} name="field" defaultValue="on_hand">
              <option value="on_hand">Sellable units</option>
              <option value="demo">Demo units</option>
            </Select>
          </Field>

          <div>
            <p className="mb-1.5 text-[0.8125rem] font-medium">Movement</p>
            <div className="flex items-stretch gap-2">
              <div
                role="radiogroup"
                aria-label="Direction"
                className="flex items-center gap-0.5 rounded-md border border-line bg-inset p-0.5"
              >
                {(
                  [
                    { value: "add", label: "Add", icon: Plus },
                    { value: "remove", label: "Remove", icon: Minus },
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={direction === value}
                    aria-label={label}
                    title={label}
                    onClick={() => setDirection(value)}
                    className={cx(
                      "flex size-8 cursor-pointer items-center justify-center rounded transition-colors duration-150",
                      direction === value
                        ? value === "add"
                          ? "bg-ok-wash text-ok-ink"
                          : "bg-crit-wash text-crit-ink"
                        : "text-faint hover:text-fg",
                    )}
                  >
                    <Icon size={15} aria-hidden />
                  </button>
                ))}
              </div>
              <NumberInput
                aria-label="Number of units"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.max(1, Number(event.target.value) || 1))
                }
                className="min-w-0 flex-1"
              />
            </div>
          </div>

          <Field
            label="Reason"
            htmlFor={`reason-${robot.slug}`}
            hint="Shown in the log."
          >
            <TextInput
              id={`reason-${robot.slug}`}
              name="reason"
              placeholder="Goods received, PO-4821"
              maxLength={80}
              required
            />
          </Field>
        </div>
      </AuthorizedForm>
    </div>
  );
}
