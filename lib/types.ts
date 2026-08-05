export const CATEGORIES = [
  "cleaning",
  "delivery",
  "reception",
  "patrol",
  "cooking",
  "canal-cleaning",
  "spider",
] as const;

export type CategoryId = (typeof CATEGORIES)[number];

export type StockState = "in-stock" | "low-stock" | "out-of-stock";

export type LifecycleState = "active" | "pre-order" | "discontinued";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  /** Shown in the catalogue header — what this class of robot is deployed for. */
  blurb: string;
}

export interface WarehouseMeta {
  code: string;
  name: string;
  city: string;
}

export interface LeaseTier {
  years: number;
  /** THB per month, inclusive of the standard service package. */
  monthly: number;
  /** The tier account managers should quote first. */
  recommended?: boolean;
}

export interface MaintenanceTier {
  years: number;
  /** THB per year. */
  yearly: number;
}

export interface Spec {
  label: string;
  value: string;
}

export interface StockByLocation {
  /** Warehouse code, e.g. BKK-WH01. */
  code: string;
  /** Sellable units on the shelf. */
  onHand: number;
  /** Units committed to demos and customer trials — not sellable. */
  demo: number;
}

export interface Robot {
  slug: string;
  name: string;
  modelId: string;
  category: CategoryId;
  /** One line, what it is. */
  tagline: string;
  /** Two or three sentences, what it is for. */
  description: string;
  lifecycle: LifecycleState;
  /** Outright purchase price in THB. */
  buyOff: number;
  /** Units already promised to signed orders but not yet shipped. */
  reserved: number;
  /** Below this on-hand count the robot is flagged for reorder. */
  reorderPoint: number;
  locations: StockByLocation[];
  lease: LeaseTier[];
  maintenance: MaintenanceTier[];
  specs: Spec[];
  /** Path under /public, or null to fall back to the category glyph. */
  image: string | null;
  /** Product one-pager, path under /public or an external URL. */
  brochure: string | null;
  updatedAt: string;
  updatedBy: string;
}

export type ActivityKind =
  | "restock"
  | "demo"
  | "price"
  | "reserve"
  | "media"
  | "content"
  | "created";

export interface ActivityEntry {
  id: string;
  robotSlug: string;
  robotName: string;
  kind: ActivityKind;
  /** Human-readable, past tense, in the interface's voice. */
  summary: string;
  /** Signed unit change where the entry moved stock. */
  delta?: number;
  at: string;
  by: string;
}

export interface Database {
  robots: Robot[];
  activity: ActivityEntry[];
}

/* ---------- people ---------- */

export const ROLES = ["admin", "editor", "viewer"] as const;

export type Role = (typeof ROLES)[number];

/** An account can hold several roles at once; permissions are their union. */
export interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  roles: Role[];
  /** Home warehouse, shown as the default location in the top bar. */
  warehouse: string;
  passwordHash: string;
  pinHash: string;
  active: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

/** The shape handed to the browser — never carries a hash. */
export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email: string;
  roles: Role[];
  warehouse: string;
}

/* ---------- derived views ---------- */

export interface StockSummary {
  onHand: number;
  demo: number;
  reserved: number;
  available: number;
  state: StockState;
}

export function summarizeStock(robot: Robot): StockSummary {
  const onHand = robot.locations.reduce((sum, l) => sum + l.onHand, 0);
  const demo = robot.locations.reduce((sum, l) => sum + l.demo, 0);
  const available = Math.max(0, onHand - robot.reserved);
  const state: StockState =
    onHand === 0
      ? "out-of-stock"
      : onHand <= robot.reorderPoint
        ? "low-stock"
        : "in-stock";
  return { onHand, demo, reserved: robot.reserved, available, state };
}
