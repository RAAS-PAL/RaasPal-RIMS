import "server-only";
import { cache } from "react";

import { BackendError, callBackend, isMissingEndpoint } from "./backend";
import type {
  RobotStockEntryResponse,
  InventoryItemResponse,
  InventorySummaryResponse,
  StockMovementResponse,
  Paged,
} from "./backend-types";

/**
 * Warehouse reads.
 *
 * <p>Every function here is a thin call to the Java service — deliberately so. The
 * JSON store this replaces was the single module that touched persistence, and that
 * property is worth keeping: everything that talks to the backend for stock lives in
 * this file and `stock-actions.ts`, and nothing else in RIMS knows a network exists.
 *
 * <p>Nothing is cached <em>between</em> requests. A stock figure that lags reality is
 * worse than a page that takes another moment, because someone acts on it.
 *
 * <p>Reads the app shell needs are wrapped in React's {@link cache}, which is a
 * different thing: it deduplicates within a single render, not across requests. The
 * layout needs the robot list for the sidebar counts and `/robots` needs the same list
 * for the page — without this that is two identical round trips to Render on every
 * navigation, and the answer cannot differ between them because it is one request.
 */

export async function listInventoryItems(options?: {
  q?: string;
  category?: string;
  lowStock?: boolean;
  /** Only parts linked to this warehouse robot — the robot detail page's list. */
  robotStockId?: string;
}): Promise<InventoryItemResponse[]> {
  const params = new URLSearchParams({ page: "0", size: "200", sort: "name,asc" });
  if (options?.q) params.set("q", options.q);
  if (options?.category) params.set("category", options.category);
  if (options?.lowStock) params.set("lowStock", "true");
  if (options?.robotStockId) params.set("robotStockId", options.robotStockId);

  const page = await callBackend<Paged<InventoryItemResponse>>(
    `/api/v1/inventory/items?${params.toString()}`,
  );
  return page?.content ?? [];
}

/**
 * Dashboard header, including the low-stock alert.
 *
 * <p>Deduplicated: the layout reads it for the bell badge and the dashboard and
 * inventory pages read it again for their tiles.
 */
export const getInventorySummary = cache(async (): Promise<InventorySummaryResponse> => {
  return (
    (await callBackend<InventorySummaryResponse>("/api/v1/inventory/summary")) ?? {
      totalItems: 0,
      lowStockCount: 0,
      stockValue: 0,
      robotsInStock: 0,
      robotsOnDemo: 0,
      lowStockItems: [],
    }
  );
});

/**
 * Recent stock movements across every part — the activity feed.
 *
 * <p>Paged in the query rather than sliced here: the ledger grows without bound, and
 * fetching all of it to show forty rows would get slower every week it is used.
 */
export async function listRecentMovements(options?: {
  page?: number;
  size?: number;
}): Promise<Paged<StockMovementResponse>> {
  const params = new URLSearchParams({
    page: String(options?.page ?? 0),
    size: String(options?.size ?? 40),
    sort: "createdAt,desc",
  });
  return (
    (await callBackend<Paged<StockMovementResponse>>(
      `/api/v1/inventory/movements?${params.toString()}`,
    )) ?? { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 }
  );
}

export async function listInventoryCategories(): Promise<string[]> {
  try {
    return (await callBackend<string[]>("/api/v1/inventory/categories")) ?? [];
  } catch {
    return [];
  }
}

/**
 * Robots the warehouse holds — stock and demo, from the standalone table.
 *
 * <p>Nothing here reaches into `robot_units`: that record covers machines already at
 * customers, which is a different question and a far more consequential table.
 */
export const listRobotStock = cache(
  async (status?: "IN_STOCK" | "DEMO"): Promise<RobotStockEntryResponse[]> => {
    const query = status ? `?status=${status}` : "";
    return (
      (await callBackend<RobotStockEntryResponse[]>(`/api/v1/inventory/robot-stock${query}`)) ?? []
    );
  },
);

/**
 * One robot entry, or null when the id genuinely does not exist.
 *
 * <p>Only a 404 for a missing row becomes null. Everything else is rethrown, which
 * matters more than it looks: this used to swallow every error, so an expired session,
 * a 500, an unreachable backend and — worst of all — a backend running older code
 * without this endpoint all rendered the same "that record does not exist" page. The
 * last one is the trap, because the record is fine and the fix is to restart the API.
 */
/**
 * One part, or null when the id genuinely does not exist.
 *
 * <p>Same error discipline as {@link getRobotStockEntry}: only a 404 becomes null,
 * so a session expiry or an older backend does not masquerade as a missing part.
 */
export async function getInventoryItem(id: string): Promise<InventoryItemResponse | null> {
  try {
    return await callBackend<InventoryItemResponse>(`/api/v1/inventory/items/${id}`);
  } catch (error) {
    if (isMissingEndpoint(error)) throw error;
    if (error instanceof BackendError && error.status === 404) return null;
    throw error;
  }
}

/** Movement history for one part — how its count reached the number shown. */
export async function listItemMovements(
  id: string,
  size = 50,
): Promise<StockMovementResponse[]> {
  const params = new URLSearchParams({ page: "0", size: String(size), sort: "createdAt,desc" });
  const page = await callBackend<Paged<StockMovementResponse>>(
    `/api/v1/inventory/items/${id}/movements?${params.toString()}`,
  );
  return page?.content ?? [];
}

export async function getRobotStockEntry(id: string): Promise<RobotStockEntryResponse | null> {
  try {
    return await callBackend<RobotStockEntryResponse>(`/api/v1/inventory/robot-stock/${id}`);
  } catch (error) {
    if (isMissingEndpoint(error)) throw error;
    if (error instanceof BackendError && error.status === 404) return null;
    throw error;
  }
}
