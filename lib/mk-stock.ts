import "server-only";

import { cookies } from "next/headers";

import { callBackend } from "./backend";

/**
 * MK spare parts — RAAS PAL holds these for MK and tracks them apart from its own stock.
 *
 * <p>Two audiences read the same numbers. RAAS PAL staff come through the normal RIMS
 * session. MK staff have no RAAS PAL account: they enter a PIN on /mk, the backend returns
 * a view token, and it lives in its own httpOnly cookie scoped to /mk. Their reads go to
 * the backend's public endpoints with that token, which can only read.
 */

/* ─── Shapes (mirror the backend's MkDtos) ─────────────────────────────── */

export type MkStatus = "OK" | "LOW" | "OUT";
export type MkMovementType = "IN" | "OUT" | "ADJUST";

export interface MkPart {
  id: string;
  partNo: string;
  name: string;
  robotModel: string | null;
  unit: string;
  minLevel: number;
  location: string | null;
  note: string | null;
  quantityOnHand: number;
  status: MkStatus;
  active: boolean;
  lastMovementOn: string | null;
  updatedAt: string;
}

export interface MkMovement {
  id: string;
  partId: string;
  partNo: string | null;
  partName: string | null;
  type: MkMovementType;
  quantityChange: number;
  balanceAfter: number;
  reason: string | null;
  reference: string | null;
  movedOn: string;
  /** Null in MK's view. */
  createdBy: string | null;
  createdAt: string;
}

export interface MkDashboard {
  from: string;
  to: string;
  parts: number;
  unitsOnHand: number;
  lowStock: number;
  outOfStock: number;
  unitsIn: number;
  unitsOut: number;
  adjustments: number;
  movements: number;
  granularity: "DAY" | "WEEK" | "MONTH";
  series: { start: string; in: number; out: number }[];
  topOut: { partId: string; partNo: string; name: string; unit: string; units: number }[];
  outReasons: { reason: string; movements: number; units: number }[];
  attention: MkPart[];
  recent: MkMovement[];
}

export interface MkAccessStatus {
  pinSet: boolean;
  pinCreatedAt: string | null;
  pinCreatedBy: string | null;
  lastUsedAt: string | null;
  activeSessions: number;
}

export interface MkPeriod {
  from?: string;
  to?: string;
}

const periodQuery = ({ from, to }: MkPeriod) => {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  const s = q.toString();
  return s ? `?${s}` : "";
};

/* ─── RAAS PAL staff (normal RIMS session) ─────────────────────────────── */

export const staff = {
  parts: (includeRetired = false) =>
    callBackend<MkPart[]>(`/api/v1/mk-stock/parts${includeRetired ? "?includeRetired=true" : ""}`),
  part: (id: string) => callBackend<MkPart>(`/api/v1/mk-stock/parts/${id}`),
  history: (id: string) => callBackend<MkMovement[]>(`/api/v1/mk-stock/parts/${id}/movements`),
  movements: () => callBackend<MkMovement[]>("/api/v1/mk-stock/movements"),
  dashboard: (period: MkPeriod) => callBackend<MkDashboard>(`/api/v1/mk-stock/dashboard${periodQuery(period)}`),
  access: () => callBackend<MkAccessStatus>("/api/v1/mk-stock/access"),
};

/* ─── MK staff (PIN session) ───────────────────────────────────────────── */

export const MK_VIEW_COOKIE = "mk_view";
export const MK_TOKEN_HEADER = "X-MK-View-Token";

export async function mkViewToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(MK_VIEW_COOKIE)?.value ?? null;
}

async function asViewer<T>(path: string): Promise<T> {
  const token = await mkViewToken();
  return callBackend<T>(path, { token: null, headers: token ? { [MK_TOKEN_HEADER]: token } : {} });
}

export const viewer = {
  parts: () => asViewer<MkPart[]>("/api/v1/public/mk-stock/parts"),
  history: (id: string) => asViewer<MkMovement[]>(`/api/v1/public/mk-stock/parts/${id}/movements`),
  dashboard: (period: MkPeriod) => asViewer<MkDashboard>(`/api/v1/public/mk-stock/dashboard${periodQuery(period)}`),
};

/* ─── Shared helpers ───────────────────────────────────────────────────── */

/** A "YYYY-MM-DD" string, or undefined for anything else, so a bad query string cannot reach the API. */
export function isoDay(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}
