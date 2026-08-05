"use client";

import { BadgeCheck, CircleDollarSign, Wrench } from "lucide-react";

import { updatePricingAction } from "@/lib/actions";
import { baht, cx, num } from "@/lib/format";
import type { Robot } from "@/lib/types";
import { Chip } from "@/components/ui/badge";
import { Editable, EditForm, EditTrigger, EditView } from "@/components/ui/editable";
import { Field, NumberInput } from "@/components/ui/field";
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";

export function PricingPanel({
  robot,
  canEdit,
}: {
  robot: Robot;
  canEdit: boolean;
}) {
  return (
    <Editable canEdit={canEdit} reason="Changing prices needs the Admin role.">
      <Panel>
        <PanelHeader>
          <PanelTitle
            eyebrow="Commercial"
            hint="One buy-off price drives all three ways RaasPal quotes this robot."
            icon={<CircleDollarSign size={16} aria-hidden />}
          >
            Pricing and contracts
          </PanelTitle>
          <PanelActions>
            <EditTrigger>Edit price</EditTrigger>
          </PanelActions>
        </PanelHeader>

        <EditView>
          <PanelBody className="space-y-6">
            <section aria-labelledby="lease-heading">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 id="lease-heading" className="text-[0.875rem] font-semibold">
                    Leasing and subscription
                  </h3>
                  <p className="mt-0.5 text-[0.75rem] text-muted">
                    Monthly rate including the standard service package. Longer terms
                    cost less per month.
                  </p>
                </div>
                <Chip tone="neutral">THB / month</Chip>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {robot.lease.map((tier) => (
                  <div
                    key={tier.years}
                    className={cx(
                      "relative rounded-lg border p-3 text-center",
                      tier.recommended
                        ? "border-[var(--brand-600)] bg-brand-wash"
                        : "border-line bg-subtle",
                    )}
                  >
                    {tier.recommended ? (
                      <span className="absolute -top-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-[var(--brand-solid)] px-2 py-0.5 text-[0.625rem] font-semibold text-[var(--brand-on-solid)]">
                        <BadgeCheck size={11} aria-hidden />
                        Best value
                      </span>
                    ) : null}
                    <p className="eyebrow">{tier.years}-year term</p>
                    <p
                      className={cx(
                        "mt-2 font-mono text-[1.25rem] font-semibold leading-none tabular-nums",
                        tier.recommended && "text-[var(--brand-ink)]",
                      )}
                    >
                      {num(tier.monthly)}
                    </p>
                    <p className="mt-1.5 text-[0.6875rem] text-muted">per month</p>
                    <p className="mt-2 border-t border-line pt-2 text-[0.625rem] text-faint">
                      {baht(tier.monthly * 12 * tier.years)} over term
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="ma-heading" className="border-t border-line pt-5">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3
                    id="ma-heading"
                    className="flex items-center gap-1.5 text-[0.875rem] font-semibold"
                  >
                    <Wrench size={14} aria-hidden className="text-muted" />
                    Maintenance agreement
                  </h3>
                  <p className="mt-0.5 text-[0.75rem] text-muted">
                    Annual cover for a robot bought outright. Priced per year of the
                    agreement.
                  </p>
                </div>
                <Chip tone="neutral">THB / year</Chip>
              </div>

              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {robot.maintenance.map((tier) => (
                  <div
                    key={tier.years}
                    className="rounded-lg border border-line bg-subtle p-3 text-center"
                  >
                    <p className="eyebrow">{tier.years}-year cover</p>
                    <p className="mt-2 font-mono text-[1.25rem] font-semibold leading-none tabular-nums">
                      {num(tier.yearly)}
                    </p>
                    <p className="mt-1.5 text-[0.6875rem] text-muted">per year</p>
                    <p className="mt-2 border-t border-line pt-2 text-[0.625rem] text-faint">
                      {baht(tier.yearly * tier.years)} over term
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </PanelBody>
        </EditView>

        <EditForm
          action={updatePricingAction}
          intent={`Change the buy-off price for ${robot.name} and re-price every lease and maintenance tier`}
          detail={`${robot.name} · currently ${baht(robot.buyOff)}`}
          submitLabel="Save price"
        >
          <PanelBody>
            <input type="hidden" name="slug" value={robot.slug} />
            <div className="max-w-sm">
              <Field
                label="Buy-off price (THB)"
                htmlFor="buy_off"
                hint="Whole baht, no separators. Lease and maintenance rates recalculate from this figure the moment it is saved."
                required
              >
                <NumberInput
                  id="buy_off"
                  name="buy_off"
                  type="number"
                  min={1}
                  step={1000}
                  defaultValue={robot.buyOff}
                  required
                />
              </Field>
            </div>

            <div className="mt-4 rounded-md border border-line bg-subtle px-3.5 py-3">
              <p className="text-[0.75rem] font-medium">How the schedules are derived</p>
              <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted">
                Lease runs from 6.24% of buy-off per month on a one-year term down to
                4.18% on five years. Maintenance runs from 12% of buy-off per year on
                a two-year agreement up to 15% on five years. Changing this price
                rewrites all nine figures at once.
              </p>
            </div>
          </PanelBody>
        </EditForm>
      </Panel>
    </Editable>
  );
}
