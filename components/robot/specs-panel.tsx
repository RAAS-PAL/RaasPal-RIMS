"use client";

import { ChevronDown, ChevronUp, Cpu, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { updateSpecsAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Editable, EditForm, EditTrigger, EditView } from "@/components/ui/editable";
import { TextInput } from "@/components/ui/field";
import {
  EmptyState,
  Panel,
  PanelBody,
  PanelFlush,
  PanelHeader,
  PanelTitle,
  PanelActions,
} from "@/components/ui/panel";
import type { Robot, Spec } from "@/lib/types";

/** Labels that recur across datasheets, offered as you type so the same
 *  measurement is not filed under three different names. */
const COMMON_LABELS = [
  "Dimensions (L × W × H)",
  "Net weight",
  "Max. moving speed",
  "Gradeability",
  "Battery capacity",
  "Working time",
  "Charging time",
  "Navigation",
  "Sensor system",
  "Connectivity",
  "Noise level",
  "Ingress protection",
  "Operating temperature",
  "Cleaning width",
  "Clean water tank",
  "Recovery tank",
  "Total payload",
  "Rated payload",
  "Display",
  "Power supply",
];

export function SpecsPanel({
  robot,
  canEdit,
}: {
  robot: Robot;
  canEdit: boolean;
}) {
  return (
    <Editable
      canEdit={canEdit}
      reason="Changing specifications needs the Editor or Admin role."
    >
      <Panel>
        <PanelHeader>
          <PanelTitle
            eyebrow="Datasheet"
            hint="What the manufacturer publishes. Check against the current datasheet before quoting."
            icon={<Cpu size={16} aria-hidden />}
          >
            Technical specifications
          </PanelTitle>
          <PanelActions>
            <span className="hidden font-mono text-[0.6875rem] text-muted sm:inline">
              Model ID · {robot.modelId}
            </span>
            <EditTrigger>Edit specifications</EditTrigger>
          </PanelActions>
        </PanelHeader>

        <EditView>
          {robot.specs.length === 0 ? (
            <EmptyState title="No specifications recorded yet">
              Press Edit specifications to add the first row. Anyone quoting this
              robot reads this table.
            </EmptyState>
          ) : (
            <PanelFlush>
              <table className="w-full text-left text-[0.8125rem]">
                <caption className="sr-only">
                  Technical specifications for {robot.name}
                </caption>
                <tbody className="divide-y divide-[var(--line)]">
                  {robot.specs.map((spec) => (
                    <tr key={spec.label} className="even:bg-subtle">
                      <th
                        scope="row"
                        className="w-2/5 min-w-44 px-4 py-2.5 align-top font-medium text-muted sm:px-5"
                      >
                        {spec.label}
                      </th>
                      <td className="px-4 py-2.5 align-top sm:px-5">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelFlush>
          )}
        </EditView>

        <EditForm
          action={updateSpecsAction}
          intent={`Save the specification table for ${robot.name}`}
          detail={`${robot.name} · ${robot.modelId}`}
          submitLabel="Save specifications"
        >
          <PanelBody>
            <input type="hidden" name="slug" value={robot.slug} />
            <SpecRows initial={robot.specs} />
          </PanelBody>
        </EditForm>
      </Panel>
    </Editable>
  );
}

interface Row {
  key: number;
  label: string;
  value: string;
}

/** Lives inside the form, so opening the editor always starts from what is
 *  saved and Cancel genuinely discards. */
function SpecRows({ initial }: { initial: Spec[] }) {
  const nextKey = useRef(initial.length);
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((spec, index) => ({ key: index, ...spec })),
  );

  function update(key: number, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    setRows((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addRow() {
    const key = nextKey.current++;
    setRows((current) => [...current, { key, label: "", value: "" }]);
    window.requestAnimationFrame(() => {
      document.getElementById(`spec-label-${key}`)?.focus();
    });
  }

  return (
    <>
      <datalist id="spec-label-suggestions">
        {COMMON_LABELS.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>

      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-2 pb-1.5 sm:grid">
        <p className="eyebrow">Label</p>
        <p className="eyebrow">Value</p>
        <p className="eyebrow pr-1 text-right">Row</p>
      </div>

      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li
            key={row.key}
            className="grid grid-cols-1 gap-2 rounded-md border border-line p-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:border-0 sm:p-0"
          >
            <TextInput
              id={`spec-label-${row.key}`}
              name="spec_label"
              list="spec-label-suggestions"
              value={row.label}
              onChange={(event) => update(row.key, { label: event.target.value })}
              placeholder="Battery capacity"
              aria-label={`Specification ${index + 1} label`}
            />
            <TextInput
              name="spec_value"
              value={row.value}
              onChange={(event) => update(row.key, { value: event.target.value })}
              placeholder="48 V / 100 Ah lithium"
              aria-label={`Specification ${index + 1} value`}
            />
            <div className="flex items-center gap-1 sm:justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${row.label || `row ${index + 1}`} up`}
                className="size-9 px-0"
              >
                <ChevronUp size={15} aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                aria-label={`Move ${row.label || `row ${index + 1}`} down`}
                className="size-9 px-0"
              >
                <ChevronDown size={15} aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setRows((current) => current.filter((item) => item.key !== row.key))
                }
                aria-label={`Remove ${row.label || `row ${index + 1}`}`}
                className="size-9 px-0 text-crit-ink hover:bg-crit-wash"
              >
                <Trash2 size={15} aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={addRow}>
          <Plus size={15} aria-hidden />
          Add specification
        </Button>
        <p className="text-[0.75rem] text-muted">
          {rows.length} {rows.length === 1 ? "row" : "rows"} · empty rows are dropped
          on save
        </p>
      </div>
    </>
  );
}
