"use client";

import { CircleDot, Clock3 } from "lucide-react";

import { updateOverviewAction } from "@/lib/actions";
import { CATEGORY_META } from "@/lib/catalog";
import { baht, since } from "@/lib/format";
import type { Robot } from "@/lib/types";
import { summarizeStock } from "@/lib/types";
import { Chip, DemoChip, StockBadge } from "@/components/ui/badge";
import { Editable, EditForm, EditTrigger, EditView } from "@/components/ui/editable";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader, PanelTitle, PanelActions } from "@/components/ui/panel";
import { StockMeter } from "@/components/ui/stock-meter";
import { RobotImage } from "./robot-image";

const LIFECYCLE_LABEL = {
  active: "Active",
  "pre-order": "Pre-order",
  discontinued: "Discontinued",
} as const;

export function HeroPanel({
  robot,
  canEdit,
  now,
}: {
  robot: Robot;
  canEdit: boolean;
  now: number;
}) {
  const stock = summarizeStock(robot);
  const meta = CATEGORY_META[robot.category];

  return (
    <Editable
      canEdit={canEdit}
      reason="Changing product details needs the Editor or Admin role."
    >
      <Panel>
        <EditView>
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
            <div className="relative border-b border-line lg:border-b-0 lg:border-r">
              <RobotImage
                name={robot.name}
                category={robot.category}
                src={robot.image}
                size="hero"
                className="aspect-4/3 w-full"
              />
              <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
                <StockBadge state={stock.state} count={stock.onHand} />
                <DemoChip count={stock.demo} />
                {robot.lifecycle !== "active" ? (
                  <Chip tone="neutral">{LIFECYCLE_LABEL[robot.lifecycle]}</Chip>
                ) : null}
              </div>
            </div>

            <div className="flex min-w-0 flex-col p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow">
                    {meta.label} robot · {robot.modelId}
                  </p>
                  <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
                    {robot.name}
                  </h1>
                  <p className="mt-1 text-[0.875rem] text-muted">{robot.tagline}</p>
                </div>
                <EditTrigger>Edit details</EditTrigger>
              </div>

              {/* The number every conversation starts with. */}
              <div className="mt-4 rounded-lg bg-chrome p-4">
                <p className="eyebrow !text-white/40">Buy-off price</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-[1.75rem] font-semibold leading-none text-white">
                    {baht(robot.buyOff)}
                  </span>
                  <span className="text-[0.75rem] font-medium text-white/45">THB</span>
                </p>
                <p className="mt-2.5 text-[0.75rem] leading-relaxed text-white/50">
                  Lease and maintenance rates below are calculated from this price.
                </p>
              </div>

              <p className="mt-4 text-[0.875rem] leading-relaxed text-muted">
                {robot.description}
              </p>

              <div className="mt-4 border-t border-line pt-3.5">
                <StockMeter robot={robot} />
              </div>

              <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3.5 text-[0.75rem] text-muted">
                <div className="flex items-center gap-1.5">
                  <CircleDot size={12} aria-hidden />
                  <dt className="sr-only">Lifecycle</dt>
                  <dd>{LIFECYCLE_LABEL[robot.lifecycle]}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock3 size={12} aria-hidden />
                  <dt className="sr-only">Last changed</dt>
                  <dd>
                    Updated {since(robot.updatedAt, now)} by{" "}
                    <span className="text-fg">{robot.updatedBy}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </EditView>

        <EditFormShell robot={robot} />
      </Panel>
    </Editable>
  );
}

function EditFormShell({ robot }: { robot: Robot }) {
  return (
    <EditForm
      action={updateOverviewAction}
      intent={`Save the product details for ${robot.name}`}
      detail={`${robot.name} · ${robot.modelId}`}
      submitLabel="Save details"
    >
      <PanelHeader className="border-t-0">
        <PanelTitle eyebrow="Editing" hint="Name, model ID and the copy sales staff read out.">
          Product details
        </PanelTitle>
        <PanelActions>
          <span className="font-mono text-[0.6875rem] text-muted">{robot.slug}</span>
        </PanelActions>
      </PanelHeader>
      <PanelBody>
        <input type="hidden" name="slug" value={robot.slug} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" required>
            <TextInput id="name" name="name" defaultValue={robot.name} required maxLength={80} />
          </Field>
          <Field
            label="Model ID"
            htmlFor="model_id"
            hint="The code on the datasheet and the purchase order."
            required
          >
            <TextInput
              id="model_id"
              name="model_id"
              defaultValue={robot.modelId}
              required
              maxLength={40}
              className="font-mono"
            />
          </Field>
          <Field
            label="Tagline"
            htmlFor="tagline"
            hint="One line, shown under the name on cards and in search."
            className="sm:col-span-2"
          >
            <TextInput
              id="tagline"
              name="tagline"
              defaultValue={robot.tagline}
              maxLength={90}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            hint="Two or three sentences on what the robot is for and where it fits."
            className="sm:col-span-2"
          >
            <TextArea
              id="description"
              name="description"
              defaultValue={robot.description}
              rows={4}
              maxLength={600}
            />
          </Field>
          <Field
            label="Lifecycle"
            htmlFor="lifecycle"
            hint="Discontinued models stay in the record but should not be quoted."
          >
            <Select id="lifecycle" name="lifecycle" defaultValue={robot.lifecycle}>
              <option value="active">Active</option>
              <option value="pre-order">Pre-order</option>
              <option value="discontinued">Discontinued</option>
            </Select>
          </Field>
        </div>
      </PanelBody>
    </EditForm>
  );
}
