"use client";

import { Warehouse } from "lucide-react";

import { updateStockAction } from "@/lib/actions";
import { WAREHOUSES } from "@/lib/catalog";
import { num } from "@/lib/format";
import type { Robot } from "@/lib/types";
import { summarizeStock } from "@/lib/types";
import { DemoChip, StockBadge } from "@/components/ui/badge";
import { Editable, EditForm, EditTrigger, EditView } from "@/components/ui/editable";
import { Field, NumberInput } from "@/components/ui/field";
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelFlush,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { StockMeter } from "@/components/ui/stock-meter";

export function StockPanel({
  robot,
  canEdit,
}: {
  robot: Robot;
  canEdit: boolean;
}) {
  const stock = summarizeStock(robot);
  /* Every warehouse gets a row, including ones holding nothing — a zero you
     can see is information; a missing row is a question. */
  const rows = WAREHOUSES.map((site) => {
    const held = robot.locations.find((location) => location.code === site.code);
    return { ...site, onHand: held?.onHand ?? 0, demo: held?.demo ?? 0 };
  });

  return (
    <Editable canEdit={canEdit} reason="Changing stock counts needs the Admin role.">
      <Panel>
        <PanelHeader>
          <PanelTitle
            eyebrow="Inventory"
            hint="Sellable units, units promised to signed orders, and units out on demo."
            icon={<Warehouse size={16} aria-hidden />}
          >
            Stock by site
          </PanelTitle>
          <PanelActions>
            <StockBadge state={stock.state} count={stock.onHand} />
            <DemoChip count={stock.demo} />
            <EditTrigger>Update stock</EditTrigger>
          </PanelActions>
        </PanelHeader>

        <EditView>
          <PanelBody className="pb-3">
            <StockMeter robot={robot} />
          </PanelBody>
          <PanelFlush>
            <table className="w-full text-left text-[0.8125rem]">
              <caption className="sr-only">Stock held for {robot.name} by site</caption>
              <thead>
                <tr className="border-y border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                  <th scope="col" className="px-4 py-2 font-medium sm:px-5">
                    Site
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    On hand
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">
                    Demo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {rows.map((row) => (
                  <tr key={row.code} className={row.onHand === 0 && row.demo === 0 ? "text-muted" : ""}>
                    <th scope="row" className="px-4 py-2.5 font-normal sm:px-5">
                      <span className="font-medium text-fg">{row.name}</span>
                      <span className="ml-2 font-mono text-[0.6875rem] text-muted">
                        {row.code}
                      </span>
                    </th>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">
                      {num(row.onHand)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums sm:px-5">
                      {num(row.demo)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line-strong bg-subtle font-semibold">
                  <th scope="row" className="px-4 py-2.5 text-left sm:px-5">
                    All sites
                  </th>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                    {num(stock.onHand)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums sm:px-5">
                    {num(stock.demo)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </PanelFlush>
          <PanelBody className="grid gap-3 border-t border-line sm:grid-cols-3">
            <Readout label="Available to sell" value={num(stock.available)} />
            <Readout label="Reserved on orders" value={num(stock.reserved)} />
            <Readout label="Reorder point" value={num(robot.reorderPoint)} />
          </PanelBody>
        </EditView>

        <EditForm
          action={updateStockAction}
          intent={`Save stock counts for ${robot.name} across all sites`}
          detail={`${robot.name} · ${robot.modelId}`}
          submitLabel="Save stock"
        >
          <PanelBody>
            <input type="hidden" name="slug" value={robot.slug} />

            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.code}
                  className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem] sm:items-end"
                >
                  <input type="hidden" name="loc_code" value={row.code} />
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] font-medium">{row.name}</p>
                    <p className="font-mono text-[0.6875rem] text-muted">{row.code}</p>
                  </div>
                  <Field label="On hand" htmlFor={`on-hand-${row.code}`}>
                    <NumberInput
                      id={`on-hand-${row.code}`}
                      name="loc_on_hand"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={row.onHand}
                    />
                  </Field>
                  <Field label="Demo" htmlFor={`demo-${row.code}`}>
                    <NumberInput
                      id={`demo-${row.code}`}
                      name="loc_demo"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={row.demo}
                    />
                  </Field>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Reserved on signed orders"
                htmlFor="reserved"
                hint="Units already sold but not yet shipped. Cannot exceed total on hand."
              >
                <NumberInput
                  id="reserved"
                  name="reserved"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={robot.reserved}
                />
              </Field>
              <Field
                label="Reorder point"
                htmlFor="reorder_point"
                hint="At or below this count the robot appears in the restock queue."
              >
                <NumberInput
                  id="reorder_point"
                  name="reorder_point"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={robot.reorderPoint}
                />
              </Field>
            </div>
          </PanelBody>
        </EditForm>
      </Panel>
    </Editable>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-subtle px-3 py-2.5">
      <p className="text-[0.6875rem] text-muted">{label}</p>
      <p className="mt-1 font-mono text-[1.125rem] font-semibold leading-none tabular-nums">
        {value}
      </p>
    </div>
  );
}
