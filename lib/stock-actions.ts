"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionState } from "./action-state";
import { authorize } from "./auth";
import { callBackend, describeBackendError } from "./backend";
import type {
  BackendRobotType,
  InventoryItemRequest,
  InventoryItemResponse,
  RobotStockEntryRequest,
  RobotStockEntryResponse,
  RobotUnitStatus,
  StockMovementRequest,
} from "./backend-types";

/**
 * Warehouse writes: receiving robots, editing them, and moving part counts.
 *
 * <p>Every one of these is guarded twice — {@link authorize} here for a useful error
 * message, and the backend's own role check, which is the actual boundary. Passing
 * the first and failing the second is expected and correct.
 */

function refresh() {
  revalidatePath("/", "layout");
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

const optional = (form: FormData, key: string) => {
  const value = text(form, key);
  return value === "" ? null : value;
};

/**
 * Every ticked value of a checkbox group.
 *
 * <p>{@code getAll} rather than {@code get}: a group submits one entry per ticked
 * box, and reading only the first would silently link a part to one robot when the
 * operator ticked six.
 */
const many = (form: FormData, key: string) =>
  form.getAll(key).map((v) => String(v).trim()).filter(Boolean);

const integer = (form: FormData, key: string) => {
  const raw = text(form, key).replace(/[^\d-]/g, "");
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : NaN;
};

/* ---------------------------------------------------------------------------
   Robots the warehouse holds — robot_inventory_temp

   Deliberately unconnected to robot_units. That table carries 152 real machines
   with telemetry, deployments and partner-API scoping hanging off them; this one
   is what someone counted on the floor. Because it makes no claim to be the fleet,
   a quantity here can honestly be a number.
--------------------------------------------------------------------------- */

function robotStockBody(formData: FormData, includeImage: boolean) {
  const quantity = integer(formData, "quantity");
  return {
    robotType: (optional(formData, "robotType") as BackendRobotType | null) ?? "CLEANING",
    brand: text(formData, "brand"),
    model: text(formData, "model"),
    version: optional(formData, "version"),
    quantity: Number.isFinite(quantity) ? quantity : 0,
    status: (text(formData, "status") === "DEMO" ? "DEMO" : "IN_STOCK") as RobotUnitStatus,
    note: optional(formData, "note"),
    // On edit the picker always submits a value — "" meaning remove — so the field
    // is sent as-is. On create there is nothing to preserve, so a blank is just null.
    ...(includeImage ? { imageUrl: String(formData.get("imageUrl") ?? "") } : {}),
  } satisfies RobotStockEntryRequest;
}

export async function createRobotStockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("stock:write");
  if (!auth.ok) return fail(auth.error);

  const body = robotStockBody(formData, true);
  if (!body.brand) return fail("Enter the robot brand.");
  if (!body.model) return fail("Enter the robot model.");

  try {
    const created = await callBackend<RobotStockEntryResponse>("/api/v1/inventory/robot-stock", {
      method: "POST",
      body,
    });
    refresh();
    return ok(`${created?.displayName ?? body.model} added — ${body.quantity} in ${
      body.status === "DEMO" ? "demo" : "stock"
    }.`);
  } catch (error) {
    // The backend names an existing row rather than tripping the unique index, so
    // "you already have this — edit it" reaches the operator intact.
    return fail(describeBackendError(error, "That robot could not be added."));
  }
}

export async function updateRobotStockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("stock:write");
  if (!auth.ok) return fail(auth.error);

  const id = text(formData, "id");
  if (!id) return fail("That robot could not be identified.");

  const body = robotStockBody(formData, true);
  if (!body.brand) return fail("Enter the robot brand.");
  if (!body.model) return fail("Enter the robot model.");

  try {
    const updated = await callBackend<RobotStockEntryResponse>(
      `/api/v1/inventory/robot-stock/${id}`,
      { method: "PUT", body },
    );
    refresh();
    return ok(`${updated?.displayName ?? "Robot"} updated.`);
  } catch (error) {
    return fail(describeBackendError(error, "That robot could not be updated."));
  }
}

export async function deleteRobotStockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("stock:write");
  if (!auth.ok) return fail(auth.error);

  const id = text(formData, "id");
  if (!id) return fail("That robot could not be identified.");

  try {
    await callBackend(`/api/v1/inventory/robot-stock/${id}`, { method: "DELETE" });
    refresh();
    return ok("Robot removed.");
  } catch (error) {
    return fail(describeBackendError(error, "That robot could not be removed."));
  }
}

/* ---------------------------------------------------------------------------
   Parts
--------------------------------------------------------------------------- */

export async function createInventoryItemAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("stock:write");
  if (!auth.ok) return fail(auth.error);

  const name = text(formData, "name");
  const category = text(formData, "category");
  if (!name) return fail("Enter the part name.");
  if (!category) return fail("Choose or enter a category.");

  const reorderPoint = integer(formData, "reorderPoint");

  const body: InventoryItemRequest = {
    // Blank means "generate one" — the backend issues INV-000001 from a database
    // sequence, so two people adding parts at once cannot collide.
    sku: optional(formData, "sku"),
    barcode: optional(formData, "barcode"),
    // A blank picker means no photo; omitted so the backend leaves it null.
    imageUrl: optional(formData, "imageUrl"),
    name,
    category,
    robotStockIds: many(formData, "robotStockIds"),
    reorderPoint: Number.isFinite(reorderPoint) ? reorderPoint : 10,
    reorderQuantity: 0,
    isActive: true,
  };

  try {
    const created = await callBackend<InventoryItemResponse>("/api/v1/inventory/items", {
      method: "POST",
      body,
    });

    // Opening stock, if any, is recorded as a RECEIPT rather than written straight
    // into the quantity. The item is created at zero and every unit it holds can be
    // traced to a movement — including the first.
    const opening = integer(formData, "openingQuantity");
    if (created?.id && Number.isFinite(opening) && opening > 0) {
      await callBackend(`/api/v1/inventory/items/${created.id}/movements`, {
        method: "POST",
        body: {
          movementType: "RECEIPT",
          quantityChange: opening,
          note: "Opening stock",
        } satisfies StockMovementRequest,
      });
    }

    refresh();
    return ok(`${name} added${created?.sku ? ` as ${created.sku}` : ""}.`);
  } catch (error) {
    return fail(describeBackendError(error, "That part could not be added."));
  }
}

/**
 * Edit a part, including which robots it fits.
 *
 * <p>The link set is sent whole, so unticking a robot removes the link. Sending a
 * patch instead would make an unticked box ambiguous between "leave it" and
 * "remove it", and the form has no way to express the difference.
 */
export async function updateInventoryItemAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("stock:write");
  if (!auth.ok) return fail(auth.error);

  const id = text(formData, "id");
  if (!id) return fail("That part could not be identified.");

  const name = text(formData, "name");
  const category = text(formData, "category");
  if (!name) return fail("Enter the part name.");
  if (!category) return fail("Choose or enter a category.");

  const reorderPoint = integer(formData, "reorderPoint");

  const body: InventoryItemRequest = {
    sku: optional(formData, "sku"),
    barcode: optional(formData, "barcode"),
    // Always sent on edit: "" means the operator cleared the photo.
    imageUrl: String(formData.get("imageUrl") ?? ""),
    name,
    category,
    robotStockIds: many(formData, "robotStockIds"),
    reorderPoint: Number.isFinite(reorderPoint) ? reorderPoint : 10,
    reorderQuantity: 0,
    isActive: true,
  };

  try {
    await callBackend<InventoryItemResponse>(`/api/v1/inventory/items/${id}`, {
      method: "PUT",
      body,
    });
    refresh();
    return ok(`${name} updated.`);
  } catch (error) {
    return fail(describeBackendError(error, "That part could not be updated."));
  }
}

/**
 * Change a part's count.
 *
 * <p>The operator states a change, never a new total: "-1, miscount" survives, "set
 * it to 47" throws away the reason and races with anyone else counting the same shelf.
 */
export async function adjustStockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("stock:write");
  if (!auth.ok) return fail(auth.error);

  const itemId = text(formData, "itemId");
  const movementType = text(formData, "movementType") || "ADJUSTMENT";
  const quantity = integer(formData, "quantityChange");

  if (!itemId) return fail("That part could not be identified.");
  if (!Number.isFinite(quantity) || quantity === 0) {
    return fail("Enter how many to add or remove.");
  }

  // The form asks for a positive number and the type decides direction, which is far
  // less error-prone than asking a warehouse operator to type a minus sign.
  const signed =
    movementType === "ISSUE" ? -Math.abs(quantity)
    : movementType === "ADJUSTMENT" ? quantity
    : Math.abs(quantity);

  try {
    await callBackend(`/api/v1/inventory/items/${itemId}/movements`, {
      method: "POST",
      body: {
        movementType: movementType as StockMovementRequest["movementType"],
        quantityChange: signed,
        robotUnitId: optional(formData, "robotUnitId"),
        note: optional(formData, "note"),
      } satisfies StockMovementRequest,
    });
    refresh();
    return ok("Stock updated.");
  } catch (error) {
    return fail(describeBackendError(error, "That change could not be saved."));
  }
}
