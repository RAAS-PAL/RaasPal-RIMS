/**
 * The backend's shapes, and how they map onto RIMS's own.
 *
 * Kept apart from `lib/types.ts` on purpose: those are RIMS's domain types, these
 * are a contract owned by the Java service. Mixing them would mean a backend field
 * rename silently rippling into the UI.
 */

import type { Role } from "./types";

/* ─── Auth ─────────────────────────────────────────────────────────────── */

/** com.raaspal.robotrecommendation.common.enums.Role */
export type BackendRole = "ADMIN" | "RAASPAL_TEAM" | "CUSTOMER" | "INVENTORY_STAFF";

export interface BackendUser {
  id: string;
  email: string;
  fullName: string;
  role: BackendRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** AuthResponse — note `accessToken`, not `token`. */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: BackendUser;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: BackendRole;
}

/**
 * One backend role becomes RIMS's role array.
 *
 * <p>The backend allows a single role per account; RIMS models several and grants
 * the union. Going one-to-many is lossless, so this direction is safe — it is the
 * reverse that would have to discard information.
 *
 * <p>INVENTORY_STAFF maps to `editor`, which is why `editor` gains `stock:write`
 * in rbac.ts. Warehouse staff must be able to change counts without also being
 * handed account management, and `admin` was previously the only role that could.
 *
 * <p>CUSTOMER gets nothing. Customers are report recipients, not staff, and have
 * no business in the inventory system at all.
 */
/**
 * The reverse: RIMS's role array collapses to the single role the backend stores.
 *
 * <p>This direction <em>is</em> lossy — "admin + editor" cannot be represented — so
 * the most privileged role wins. That is the safe way round: a user keeps every
 * capability they had, and none are silently revoked by the account screen. It does
 * mean an account cannot hold two roles any more, which is why the UI should offer a
 * single choice rather than checkboxes that quietly collapse on save.
 */
export function backendRoleForRoles(roles: Role[]): BackendRole {
  if (roles.includes("admin")) return "ADMIN";
  if (roles.includes("editor")) return "INVENTORY_STAFF";
  return "RAASPAL_TEAM";
}

export function rolesForBackendRole(role: BackendRole): Role[] {
  switch (role) {
    case "ADMIN":
      return ["admin"];
    case "INVENTORY_STAFF":
      return ["editor"];
    case "RAASPAL_TEAM":
      return ["viewer"];
    case "CUSTOMER":
    default:
      return [];
  }
}

/* ─── Robot units ──────────────────────────────────────────────────────── */

/**
 * IN_STOCK and DEMO are the warehouse's concern and appear in RIMS; RENT and SOLD
 * are at a customer under a commercial agreement and are never fetched here.
 */
export type RobotUnitStatus = "IN_STOCK" | "DEMO" | "RENT" | "SOLD";

/** What RIMS lists. A demo unit is out on trial but still ours and still coming back. */
export const WAREHOUSE_STATUSES: RobotUnitStatus[] = ["IN_STOCK", "DEMO"];

/** Mirrors the backend `RobotType` enum. Both must be changed together. */
export type BackendRobotType =
  | "CLEANING"
  | "DELIVERY"
  | "MOWING"
  | "SECURITY"
  | "COOKING"
  | "CLEANING_EQUIPMENT"
  | "RECEPTION";

/**
 * The types the platform models, in the order they are shown.
 *
 * <p>This lives here rather than in a component because the sidebar counts them, the
 * robots page filters by them and the add form offers them — three screens that must
 * not be able to disagree about what a valid type is.
 */
export const ROBOT_TYPES: BackendRobotType[] = [
  "CLEANING",
  "CLEANING_EQUIPMENT",
  "DELIVERY",
  "MOWING",
  "SECURITY",
  "COOKING",
  "RECEPTION",
];

/** Enum values are never shown raw — `CLEANING_EQUIPMENT` is not a label. */
export const ROBOT_TYPE_LABELS: Record<BackendRobotType, string> = {
  CLEANING: "Cleaning",
  CLEANING_EQUIPMENT: "Cleaning Equipment",
  DELIVERY: "Delivery",
  MOWING: "Mowing",
  SECURITY: "Security",
  COOKING: "Cooking",
  RECEPTION: "Reception",
};

/** Narrows an untrusted query-string value to a type, or null. */
export function asRobotType(value: string | undefined): BackendRobotType | null {
  return value && (ROBOT_TYPES as string[]).includes(value)
    ? (value as BackendRobotType)
    : null;
}

export interface RobotUnitResponse {
  id: string;
  serialNumber: string;
  brand: string;
  model: string | null;
  name: string | null;
  status: RobotUnitStatus;
  version: string | null;
  robotType: BackendRobotType;
  robotId: string | null;
}

export interface ReceiveStockRequest {
  brand: string;
  model?: string | null;
  robotType?: BackendRobotType;
  robotId?: string | null;
  /** One per robot. The count is derived from these — never typed. */
  serialNumbers: string[];
  name?: string | null;
  /** IN_STOCK or DEMO. The backend refuses RENT and SOLD here. */
  status?: RobotUnitStatus;
}

export interface UpdateStockUnitRequest {
  brand: string;
  model?: string | null;
  name?: string | null;
  robotType?: BackendRobotType;
  robotId?: string | null;
  location?: string | null;
  status?: RobotUnitStatus;
}

/* ─── Robot stock (robot_inventory_temp) ───────────────────────────────── */

/**
 * A robot the warehouse holds, as the inventory team records it.
 *
 * <p>Backed by a **standalone** table with no link to `robot_units` or `robots`.
 * That independence is why `quantity` is a plain number here: the table makes no
 * claim to be the fleet record, so counting is honest. On `robot_units` it would not
 * be — a serial is the robot's identity across telemetry, reports and the partner
 * API, and a count with no serials behind it would drift the first time one was
 * deployed.
 */
export interface RobotStockEntryResponse {
  id: string;
  robotType: BackendRobotType;
  brand: string;
  model: string;
  /** Revision or configuration — "v1.3", "Roller Brush". */
  version: string | null;
  imageUrl: string | null;
  quantity: number;
  /** What it was before the last change to the count. One step back, not a history. */
  previousQuantity: number | null;
  previousQuantityAt: string | null;
  /** IN_STOCK or DEMO only. */
  status: RobotUnitStatus;
  location: string | null;
  note: string | null;
  /** "Gausium Phantas v1.3" — assembled server-side so every screen agrees. */
  displayName: string;
  updatedAt: string;
}

export interface RobotStockEntryRequest {
  robotType?: BackendRobotType;
  brand: string;
  model: string;
  version?: string | null;
  /** Omit to keep the current photo; send "" to remove it. */
  imageUrl?: string | null;
  quantity?: number | null;
  status?: RobotUnitStatus;
  location?: string | null;
  note?: string | null;
}

/* ─── Inventory ────────────────────────────────────────────────────────── */

export type MovementType = "RECEIPT" | "ISSUE" | "ADJUSTMENT" | "RETURN";

/** A robot a part fits — id to link to its page, name already assembled by the backend. */
export interface LinkedRobot {
  id: string;
  displayName: string;
}

export interface InventoryItemResponse {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  category: string;
  /** The warehouse robots this part fits. Empty means universal. */
  robots: LinkedRobot[];
  quantityOnHand: number;
  reorderPoint: number;
  reorderQuantity: number;
  location: string | null;
  isActive: boolean;
  /** Computed server-side so the dashboard count and the row badge cannot disagree. */
  lowStock: boolean;
  updatedAt: string;
}

export interface InventoryItemRequest {
  /** The part number. Blank means the backend issues INV-000001. */
  sku?: string | null;
  barcode?: string | null;
  name: string;
  category: string;
  /**
   * The warehouse robots this part fits. Sent in full on every save — the form
   * submits what is ticked, so the whole set is the intent and an untick removes.
   */
  robotStockIds?: string[] | null;
  reorderPoint?: number | null;
  reorderQuantity?: number | null;
  location?: string | null;
  isActive?: boolean | null;
}

export interface StockMovementRequest {
  movementType: MovementType;
  /** Signed. The API rejects zero, and rejects a RECEIPT that is negative. */
  quantityChange: number;
  robotUnitId?: string | null;
  note?: string | null;
}

/**
 * One line of stock history.
 *
 * <p>Append-only on the backend: a mistake is corrected by recording a compensating
 * ADJUSTMENT, never by editing the row. That is what makes it an audit trail, and it
 * is why nothing here offers an edit.
 */
export interface StockMovementResponse {
  id: string;
  inventoryItemId: string;
  /** Null if the part has since been deleted — the movement still stands. */
  itemName: string | null;
  itemSku: string | null;
  movementType: MovementType;
  /** Signed: +50 received, -2 issued. */
  quantityChange: number;
  /** The count immediately after this movement. */
  balanceAfter: number;
  robotUnitId: string | null;
  robotSerialNumber: string | null;
  note: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  RECEIPT: "Received",
  ISSUE: "Issued",
  RETURN: "Returned",
  ADJUSTMENT: "Correction",
};

export interface InventorySummaryResponse {
  totalItems: number;
  lowStockCount: number;
  stockValue: number;
  /** Robots available, from the warehouse's own list — not the deployed fleet. */
  robotsInStock: number;
  /** Robots out on trial. Separate from available, never summed with it. */
  robotsOnDemo: number;
  lowStockItems: InventoryItemResponse[];
}

/** Spring Data page, as PagedResponse serialises it. */
export interface Paged<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
