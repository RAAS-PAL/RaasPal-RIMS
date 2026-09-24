"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { fail, ok, type ActionState } from "./action-state";
import { authorize } from "./auth";
import { BackendError, callBackend, describeBackendError } from "./backend";
import { MK_TOKEN_HEADER, MK_VIEW_COOKIE, mkViewToken } from "./mk-stock";

/**
 * Writes for MK spare parts, plus MK staff's PIN sign-in.
 *
 * <p>Staff writes are checked twice, as everywhere in RIMS: {@link authorize} here for a
 * readable message, and the backend's role check, which is the real boundary.
 */

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (form: FormData, key: string) => text(form, key) || null;
const whole = (form: FormData, key: string) => {
  const raw = text(form, key);
  if (raw === "") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : NaN;
};

function refresh() {
  revalidatePath("/mk-stock", "layout");
}

/**
 * The photo field from the picker: absent = leave the photo alone, "" = remove it, a data URI
 * = replace it. Saved after the part itself, through its own endpoint.
 */
async function savePhoto(partId: string, form: FormData) {
  const image = form.get("image");
  if (image === null) return;
  const value = String(image);
  if (value === "") {
    await callBackend(`/api/v1/mk-stock/parts/${partId}/image`, { method: "DELETE" });
  } else {
    await callBackend(`/api/v1/mk-stock/parts/${partId}/image`, { method: "PUT", body: { image: value } });
  }
}

function partBody(form: FormData) {
  return {
    partNo: text(form, "partNo"),
    name: text(form, "name"),
    robotModel: optional(form, "robotModel"),
    unit: optional(form, "unit"),
    minLevel: whole(form, "minLevel") ?? 0,
    location: optional(form, "location"),
    note: optional(form, "note"),
  };
}

/* ─── Staff ────────────────────────────────────────────────────────────── */

export async function createMkPartAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorize("mkstock:write");
  if (!auth.ok) return fail(auth.error);
  const body = partBody(formData);
  const opening = whole(formData, "openingQuantity") ?? 0;
  if (!body.partNo || !body.name) return fail("Enter the part number and name.");
  if (Number.isNaN(body.minLevel) || body.minLevel < 0) return fail("The minimum level must be 0 or more.");
  if (Number.isNaN(opening) || opening < 0) return fail("The opening stock must be 0 or more.");
  try {
    const part = await callBackend<{ id: string }>("/api/v1/mk-stock/parts", { method: "POST", body: { ...body, openingQuantity: opening } });
    try {
      await savePhoto(part.id, formData);
    } catch (error) {
      refresh();
      return fail(`${body.partNo} was added, but the photo was not saved: ${describeBackendError(error, "try again from Edit details.")}`);
    }
    refresh();
    return ok(`${body.partNo} added.`);
  } catch (error) {
    return fail(describeBackendError(error, "That part could not be added."));
  }
}

export async function updateMkPartAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorize("mkstock:write");
  if (!auth.ok) return fail(auth.error);
  const id = text(formData, "id");
  const body = partBody(formData);
  if (!id) return fail("That part could not be identified.");
  if (!body.partNo || !body.name) return fail("Enter the part number and name.");
  if (Number.isNaN(body.minLevel) || body.minLevel < 0) return fail("The minimum level must be 0 or more.");
  try {
    await callBackend(`/api/v1/mk-stock/parts/${id}`, {
      method: "PUT",
      // The form sends a hidden "false" and, when ticked, a "true" - so look at every value.
      body: { ...body, active: formData.getAll("active").map(String).includes("true") },
    });
    await savePhoto(id, formData);
    refresh();
    return ok(`${body.partNo} updated.`);
  } catch (error) {
    return fail(describeBackendError(error, "That part could not be updated."));
  }
}

/**
 * Stock in, stock out or a correction. The quantity is typed positive for IN and OUT (the
 * type sets the direction); a correction is signed. A reason is required for OUT and ADJUST.
 */
export async function moveMkStockAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorize("mkstock:write");
  if (!auth.ok) return fail(auth.error);
  const id = text(formData, "partId");
  const type = text(formData, "type");
  const quantity = whole(formData, "quantity");
  const reason = optional(formData, "reason");
  if (!id) return fail("That part could not be identified.");
  if (!["IN", "OUT", "ADJUST"].includes(type)) return fail("Choose stock in, stock out or a correction.");
  if (quantity === null || Number.isNaN(quantity) || quantity === 0) return fail("Enter how many.");
  if (type !== "ADJUST" && quantity < 0) return fail("Enter a positive number - the type sets the direction.");
  if (type !== "IN" && !reason) return fail(type === "OUT" ? "Write why it went out." : "Write why the count is corrected.");
  try {
    await callBackend(`/api/v1/mk-stock/parts/${id}/movements`, {
      method: "POST",
      body: {
        type,
        quantity,
        reason,
        reference: optional(formData, "reference"),
        movedOn: optional(formData, "movedOn"),
      },
    });
    refresh();
    return ok(type === "IN" ? "Stock in recorded." : type === "OUT" ? "Stock out recorded." : "Correction recorded.");
  } catch (error) {
    return fail(describeBackendError(error, "That movement could not be saved."));
  }
}

export async function setMkPinAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorize("mkstock:pin");
  if (!auth.ok) return fail(auth.error);
  const pin = text(formData, "pin");
  if (pin !== text(formData, "confirm")) return fail("The two PINs do not match.");
  if (!/^\d{6,12}$/.test(pin)) return fail("The PIN must be 6 to 12 digits.");
  try {
    await callBackend("/api/v1/mk-stock/access/pin", { method: "PUT", body: { pin } });
    refresh();
    return ok("New PIN set. The old PIN no longer works and MK must sign in again.");
  } catch (error) {
    return fail(describeBackendError(error, "The PIN could not be set."));
  }
}

/** The reset result carries the new PIN - the one time anyone can see it. */
export interface PinResetState extends ActionState {
  pin?: string;
}

export async function resetMkPinAction(): Promise<PinResetState> {
  const auth = await authorize("mkstock:pin");
  if (!auth.ok) return fail(auth.error);
  try {
    const result = await callBackend<{ pin: string }>("/api/v1/mk-stock/access/pin/reset", { method: "POST" });
    refresh();
    return { ...ok("New PIN made. The old PIN no longer works and MK must sign in again."), pin: result.pin };
  } catch (error) {
    return fail(describeBackendError(error, "The PIN could not be reset."));
  }
}

export async function disableMkAccessAction(): Promise<ActionState> {
  const auth = await authorize("mkstock:pin");
  if (!auth.ok) return fail(auth.error);
  try {
    await callBackend("/api/v1/mk-stock/access/pin", { method: "DELETE" });
    refresh();
    return ok("MK access turned off. Set a new PIN to turn it back on.");
  } catch (error) {
    return fail(describeBackendError(error, "Access could not be turned off."));
  }
}

/* ─── MK staff: PIN sign-in ────────────────────────────────────────────── */

/** The viewer's own address, for the backend's per-client lockout (RIMS calls it server-side). */
async function clientAddress(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function mkSignInAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const pin = text(formData, "pin");
  if (!/^\d{4,12}$/.test(pin)) return fail("Enter the PIN you were given.");
  let session: { token: string; expiresAt: string };
  try {
    session = await callBackend<{ token: string; expiresAt: string }>("/api/v1/public/mk-stock/session", {
      method: "POST",
      token: null,
      body: { pin },
      headers: { "X-MK-Client": await clientAddress() },
    });
  } catch (error) {
    if (error instanceof BackendError && (error.status === 401 || error.status === 429)) return fail(error.message);
    return fail(describeBackendError(error, "Could not check the PIN. Try again in a moment."));
  }
  const store = await cookies();
  store.set(MK_VIEW_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/mk",
    expires: new Date(session.expiresAt),
  });
  redirect("/mk/dashboard");
}

export async function mkSignOutAction(): Promise<void> {
  const token = await mkViewToken();
  if (token) {
    try {
      await callBackend("/api/v1/public/mk-stock/session", {
        method: "DELETE",
        token: null,
        headers: { [MK_TOKEN_HEADER]: token },
      });
    } catch {
      // The cookie goes either way; an unreachable backend must not keep someone signed in.
    }
  }
  const store = await cookies();
  // Expired on the same path it was set on, or the browser keeps the /mk copy.
  store.set(MK_VIEW_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/mk",
    maxAge: 0,
  });
  redirect("/mk");
}
