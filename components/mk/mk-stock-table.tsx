import Link from "next/link";
import type { ReactNode } from "react";

import type { MkPart } from "@/lib/mk-stock";
import { cx, num } from "@/lib/format";
import { MkPartPhoto, MkStatusBadge, mkDay } from "./mk-bits";

/**
 * Every MK part and its stock. Shared by RAAS PAL staff (with {@code actions}) and MK's
 * read-only view (without).
 */
export function MkStockTable({
  parts,
  partHref,
  photoSrc,
  actions,
}: {
  parts: MkPart[];
  partHref: (id: string) => string;
  /** Each part's photo URL (null = placeholder). */
  photoSrc: (part: MkPart) => string | null;
  actions?: (part: MkPart) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-[0.8125rem]">
        <thead>
          <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
            <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Part</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Robot model</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">On hand</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">Minimum</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Location</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Last movement</th>
            {actions ? <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5"><span className="sr-only">Actions</span></th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {parts.map((p) => (
            <tr key={p.id} className={cx("align-top hover:bg-subtle", !p.active && "opacity-55")}>
              <th scope="row" className="px-4 py-3 font-normal sm:px-5">
                <div className="flex items-start gap-3">
                  <MkPartPhoto src={photoSrc(p)} name={p.name} />
                  <div className="min-w-0">
                    <Link href={partHref(p.id)} className="font-semibold underline-offset-2 hover:underline">{p.name}</Link>
                    <p className="mt-0.5 font-mono text-[0.6875rem] text-muted">
                      {p.partNo}
                      {!p.active ? " · retired" : ""}
                    </p>
                  </div>
                </div>
              </th>
              <td className="px-3 py-3 text-muted">{p.robotModel ?? "—"}</td>
              <td className="px-3 py-3 text-right">
                <span className="font-mono font-semibold tabular-nums">{num(p.quantityOnHand)}</span>{" "}
                <span className="text-[0.75rem] text-muted">{p.unit}</span>
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums text-muted">{p.minLevel > 0 ? num(p.minLevel) : "—"}</td>
              <td className="px-3 py-3"><MkStatusBadge status={p.status} /></td>
              <td className="px-3 py-3 text-muted">{p.location ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-3 text-muted">{mkDay(p.lastMovementOn)}</td>
              {actions ? <td className="px-4 py-3 text-right sm:px-5"><div className="flex justify-end gap-1.5">{actions(p)}</div></td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Search and status filter as a plain GET form, so the filtered list has a URL. */
export function MkStockFilters({ basePath, q, status, count }: { basePath: string; q: string; status: string; count: number }) {
  const options = [
    { value: "", label: "All" },
    { value: "LOW", label: "Low stock" },
    { value: "OUT", label: "Out of stock" },
  ];
  return (
    <form action={basePath} method="get" className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search part number, name, robot model, location"
        className="h-9 min-w-64 flex-1 rounded-md border border-line bg-surface px-3 text-[0.8125rem]"
      />
      <select name="status" defaultValue={status} className="h-9 rounded-md border border-line bg-surface px-2 text-[0.8125rem]">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button type="submit" className="h-9 rounded-md border border-line bg-surface px-3 text-[0.8125rem] font-medium hover:bg-inset">
        Filter
      </button>
      <span className="text-[0.75rem] text-muted">{num(count)} {count === 1 ? "part" : "parts"}</span>
    </form>
  );
}

export function filterParts(parts: MkPart[], q: string, status: string): MkPart[] {
  const needle = q.trim().toLowerCase();
  return parts.filter((p) => {
    if (status === "LOW" && p.status !== "LOW") return false;
    if (status === "OUT" && p.status !== "OUT") return false;
    if (!needle) return true;
    return [p.partNo, p.name, p.robotModel, p.location].some((v) => v?.toLowerCase().includes(needle));
  });
}
