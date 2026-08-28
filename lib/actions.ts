"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fail, ok, type ActionState } from "./action-state";
import {
  authorize,
  endSession,
  getCurrentUser,
  signIn,
  createUser,
  updateUser,
} from "./auth";
import { leaseSchedule, maintenanceSchedule, warehouseName } from "./catalog";
import { baht, num } from "./format";
import { backendRoleForRoles } from "./backend-types";
import { callBackend, describeBackendError } from "./backend";
import { can } from "./rbac";
import { commitRobotChange } from "./store";
import { ROLES, type ActivityEntry, type Role, type Spec } from "./types";

type LogLine = Omit<ActivityEntry, "id" | "robotSlug" | "robotName" | "at">;

/** One hammer: every page in this app reads the same two collections. */
function refreshEverything() {
  revalidatePath("/", "layout");
}

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const digits = (formData: FormData, key: string) => {
  const raw = text(formData, key).replace(/[^\d-]/g, "");
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : NaN;
};

/* ---------------------------------------------------------------------------
   Sessions
--------------------------------------------------------------------------- */

export async function signInAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // The field is still named "username" so the existing form keeps working, but the
  // platform identifies people by email. Accepting either spelling avoids breaking
  // anyone mid-migration.
  const identity = text(formData, "email") || text(formData, "username");
  const password = String(formData.get("password") ?? "");
  if (!identity || !password) {
    return fail("Enter your email address and password.");
  }

  // signIn sets the session itself: it is the only place holding the backend's
  // token, and handing it back for the caller to store would invite forgetting to.
  const result = await signIn(identity, password);
  if (!result.ok) return fail(result.error);
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/login");
}

/*
 * changePinAction and resetUserPinAction were removed with the PIN itself.
 *
 * The PIN was a second factor over a JSON file that had no other access control.
 * Identity is now the backend's, and every write is checked against a signed JWT and
 * a server-side role — so the PIN guarded nothing the API did not already guard, and
 * keeping it would have meant storing a secret in RIMS that the backend knows nothing
 * about. Password changes now live on the backend; see changePasswordAction below.
 */

/**
 * Change your own password.
 *
 * <p>The backend takes the account from the token, so there is no account field here
 * and no way to aim this at someone else. It also re-checks the current password:
 * holding a session proves the browser was authenticated at some point, not that the
 * owner is the one typing now.
 *
 * <p>The confirmation field is checked here rather than server-side — it exists to
 * catch a typo before it becomes a password nobody knows, which is a form concern,
 * not an API one.
 */
export async function changePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) return fail("Enter your current password.");
  if (newPassword.length < 8) return fail("Your new password must be at least 8 characters.");
  if (newPassword !== confirmPassword) return fail("The two new passwords do not match.");

  try {
    await callBackend("/api/v1/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
    return ok("Password changed. It applies the next time you sign in.");
  } catch (error) {
    return fail(describeBackendError(error, "That password could not be changed."));
  }
}

/* ---------------------------------------------------------------------------
   Robot content
--------------------------------------------------------------------------- */

export async function updateOverviewAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = text(formData, "slug");
  const auth = await authorize("content:write");
  if (!auth.ok) return fail(auth.error);

  const name = text(formData, "name");
  const modelId = text(formData, "model_id");
  const tagline = text(formData, "tagline");
  const description = text(formData, "description");
  const lifecycle = text(formData, "lifecycle");

  if (!name) return fail("A robot needs a name.");
  if (!modelId) return fail("A robot needs a model ID.");
  if (!["active", "pre-order", "discontinued"].includes(lifecycle)) {
    return fail("Choose a lifecycle state.");
  }

  const result = await commitRobotChange(slug, (robot) => {
    const entries: LogLine[] = [];
    const changed: string[] = [];
    if (robot.name !== name) changed.push(`name to "${name}"`);
    if (robot.modelId !== modelId) changed.push(`model ID to ${modelId}`);
    if (robot.tagline !== tagline) changed.push("tagline");
    if (robot.description !== description) changed.push("description");
    if (robot.lifecycle !== lifecycle) changed.push(`lifecycle to ${lifecycle}`);

    if (changed.length > 0) {
      entries.push({
        kind: "content",
        summary: `Updated ${changed.join(", ")}`,
        by: auth.user.name,
      });
    }
    return {
      robot: {
        ...robot,
        name,
        modelId,
        tagline,
        description,
        lifecycle: lifecycle as typeof robot.lifecycle,
      },
      entries,
    };
  });

  if (!result.ok) return fail(result.error);
  refreshEverything();
  return ok("Overview saved.");
}

export async function updateSpecsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = text(formData, "slug");
  const auth = await authorize("content:write");
  if (!auth.ok) return fail(auth.error);

  const labels = formData.getAll("spec_label").map((v) => String(v).trim());
  const values = formData.getAll("spec_value").map((v) => String(v).trim());

  const specs: Spec[] = [];
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i];
    const value = values[i] ?? "";
    /* A row with neither side filled in is a row the editor abandoned. */
    if (!label && !value) continue;
    if (!label) return fail(`Row ${i + 1} has a value but no label.`);
    if (!value) return fail(`"${label}" has no value. Fill it in or remove the row.`);
    specs.push({ label, value });
  }

  const seen = new Set<string>();
  for (const spec of specs) {
    const key = spec.label.toLowerCase();
    if (seen.has(key)) return fail(`"${spec.label}" is listed twice.`);
    seen.add(key);
  }

  const result = await commitRobotChange(slug, (robot) => {
    const before = robot.specs;
    const added = specs.filter(
      (spec) => !before.some((old) => old.label === spec.label),
    ).length;
    const removed = before.filter(
      (old) => !specs.some((spec) => spec.label === old.label),
    ).length;
    const edited = specs.filter((spec) =>
      before.some((old) => old.label === spec.label && old.value !== spec.value),
    ).length;

    if (added + removed + edited === 0) {
      return { robot, entries: [] };
    }

    const parts = [
      added > 0 && `added ${added}`,
      edited > 0 && `changed ${edited}`,
      removed > 0 && `removed ${removed}`,
    ].filter(Boolean) as string[];

    return {
      robot: { ...robot, specs },
      entries: [
        {
          kind: "content",
          summary: `Specifications: ${parts.join(", ")}`,
          by: auth.user.name,
        },
      ],
    };
  });

  if (!result.ok) return fail(result.error);
  refreshEverything();
  return ok(`Specifications saved — ${specs.length} rows.`);
}

export async function updateMediaAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = text(formData, "slug");
  const auth = await authorize("media:write");
  if (!auth.ok) return fail(auth.error);

  const image = text(formData, "image") || null;
  const brochure = text(formData, "brochure") || null;

  for (const [field, value] of [
    ["Photo", image],
    ["Brochure", brochure],
  ] as const) {
    if (value && !/^(\/|https?:\/\/)/.test(value)) {
      return fail(`${field} must start with "/" for a file in public, or "https://".`);
    }
  }

  const result = await commitRobotChange(slug, (robot) => {
    if (robot.image === image && robot.brochure === brochure) {
      return { robot, entries: [] };
    }
    const changed = [
      robot.image !== image && "photo",
      robot.brochure !== brochure && "brochure",
    ].filter(Boolean) as string[];
    return {
      robot: { ...robot, image, brochure },
      entries: [
        { kind: "media", summary: `Updated ${changed.join(" and ")}`, by: auth.user.name },
      ],
    };
  });

  if (!result.ok) return fail(result.error);
  refreshEverything();
  return ok("Media saved.");
}

/* ---------------------------------------------------------------------------
   Pricing — admin only, and it re-prices every quote for this robot
--------------------------------------------------------------------------- */

export async function updatePricingAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = text(formData, "slug");
  const auth = await authorize("price:write");
  if (!auth.ok) return fail(auth.error);

  const buyOff = digits(formData, "buy_off");
  if (!Number.isFinite(buyOff) || buyOff <= 0) {
    return fail("Enter the buy-off price in whole baht.");
  }
  if (buyOff > 100_000_000) {
    return fail("That price looks wrong — the ceiling is ฿100,000,000.");
  }

  const result = await commitRobotChange(slug, (robot) => {
    if (robot.buyOff === buyOff) return { robot, entries: [] };
    const direction = buyOff > robot.buyOff ? "raised" : "lowered";
    return {
      robot: {
        ...robot,
        buyOff,
        lease: leaseSchedule(buyOff),
        maintenance: maintenanceSchedule(buyOff),
      },
      entries: [
        {
          kind: "price",
          summary: `Buy-off ${direction} from ${baht(robot.buyOff)} to ${baht(buyOff)}`,
          by: auth.user.name,
        },
      ],
    };
  });

  if (!result.ok) return fail(result.error);
  refreshEverything();
  return ok("Price saved. Lease and maintenance rates were recalculated.");
}

/* ---------------------------------------------------------------------------
   Stock — admin only
--------------------------------------------------------------------------- */

export async function updateStockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = text(formData, "slug");
  const auth = await authorize("stock:write");
  if (!auth.ok) return fail(auth.error);

  const codes = formData.getAll("loc_code").map((v) => String(v));
  const onHandValues = formData.getAll("loc_on_hand").map((v) => Number(v));
  const demoValues = formData.getAll("loc_demo").map((v) => Number(v));
  const reserved = digits(formData, "reserved");
  const reorderPoint = digits(formData, "reorder_point");

  if (!Number.isFinite(reserved) || reserved < 0) {
    return fail("Reserved units must be zero or more.");
  }
  if (!Number.isFinite(reorderPoint) || reorderPoint < 0) {
    return fail("The reorder point must be zero or more.");
  }

  const locations = codes.map((code, index) => ({
    code,
    onHand: onHandValues[index],
    demo: demoValues[index],
  }));

  for (const location of locations) {
    if (!Number.isInteger(location.onHand) || location.onHand < 0) {
      return fail(`On-hand at ${location.code} must be a whole number, zero or more.`);
    }
    if (!Number.isInteger(location.demo) || location.demo < 0) {
      return fail(`Demo units at ${location.code} must be a whole number, zero or more.`);
    }
  }

  const totalOnHand = locations.reduce((sum, l) => sum + l.onHand, 0);
  if (reserved > totalOnHand) {
    return fail(
      `${reserved} reserved is more than the ${totalOnHand} on hand. Reduce the reservation or add stock.`,
    );
  }

  const result = await commitRobotChange(slug, (robot) => {
    const entries: LogLine[] = [];

    for (const location of locations) {
      const before = robot.locations.find((l) => l.code === location.code);
      const wasOnHand = before?.onHand ?? 0;
      const wasDemo = before?.demo ?? 0;

      if (location.onHand !== wasOnHand) {
        const delta = location.onHand - wasOnHand;
        entries.push({
          kind: "restock",
          summary: `${warehouseName(location.code)} on hand ${wasOnHand} → ${location.onHand}`,
          delta,
          by: auth.user.name,
        });
      }
      if (location.demo !== wasDemo) {
        const delta = location.demo - wasDemo;
        entries.push({
          kind: "demo",
          summary: `${warehouseName(location.code)} demo units ${wasDemo} → ${location.demo}`,
          delta,
          by: auth.user.name,
        });
      }
    }

    if (robot.reserved !== reserved) {
      entries.push({
        kind: "reserve",
        summary: `Reserved ${robot.reserved} → ${reserved}`,
        delta: reserved - robot.reserved,
        by: auth.user.name,
      });
    }
    if (robot.reorderPoint !== reorderPoint) {
      entries.push({
        kind: "restock",
        summary: `Reorder point ${robot.reorderPoint} → ${reorderPoint}`,
        by: auth.user.name,
      });
    }

    return { robot: { ...robot, locations, reserved, reorderPoint }, entries };
  });

  if (!result.ok) return fail(result.error);
  refreshEverything();
  return ok(`Stock saved — ${num(totalOnHand)} on hand across all sites.`);
}

/** The one-line adjustment used on the inventory table. */
export async function adjustStockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = text(formData, "slug");
  const auth = await authorize("stock:write");
  if (!auth.ok) return fail(auth.error);

  const code = text(formData, "code");
  const field = text(formData, "field");
  const delta = digits(formData, "delta");
  const reason = text(formData, "reason");

  if (field !== "on_hand" && field !== "demo") {
    return fail("Choose whether you are moving sellable or demo units.");
  }
  if (!Number.isFinite(delta) || delta === 0) {
    return fail("Enter how many units to add or remove.");
  }
  if (!reason) return fail("Give a reason so the log explains itself later.");

  const result = await commitRobotChange(slug, (robot) => {
    const locations = [...robot.locations];
    let index = locations.findIndex((l) => l.code === code);
    if (index === -1) {
      index = locations.push({ code, onHand: 0, demo: 0 }) - 1;
    }

    const key = field === "on_hand" ? "onHand" : "demo";
    const before = locations[index][key];
    const after = before + delta;
    if (after < 0) {
      throw new Error(
        `${warehouseName(code)} holds ${before}. Removing ${Math.abs(delta)} would go below zero.`,
      );
    }

    locations[index] = { ...locations[index], [key]: after };

    return {
      robot: { ...robot, locations },
      entries: [
        {
          kind: field === "on_hand" ? ("restock" as const) : ("demo" as const),
          summary: `${warehouseName(code)} ${field === "on_hand" ? "on hand" : "demo units"} ${before} → ${after} · ${reason}`,
          delta,
          by: auth.user.name,
        },
      ],
    };
  }).catch((error: Error) => ({ ok: false as const, error: error.message }));

  if (!result.ok) return fail(result.error);
  refreshEverything();
  return ok(`${delta > 0 ? "Added" : "Removed"} ${Math.abs(delta)} at ${code}.`);
}
/* ---------------------------------------------------------------------------
   Accounts — admin only

   Backed by the Java service. RIMS no longer stores accounts or password hashes:
   data/users.json is gone, and so is the PIN. The last-admin guard now lives in
   UserService, where it belongs — a check enforced only here could be bypassed by
   calling the API directly.
--------------------------------------------------------------------------- */

/**
 * The backend stores one role per account, so a multi-select would silently
 * collapse on save. The form offers a single choice; this reads it defensively in
 * case an older form posts several.
 */
function parseRole(formData: FormData): Role {
  const selected = formData
    .getAll("roles")
    .map((value) => String(value))
    .filter((value): value is Role => (ROLES as readonly string[]).includes(value));
  return selected.includes("admin")
    ? "admin"
    : selected.includes("editor")
      ? "editor"
      : "viewer";
}

export async function createUserAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("users:manage");
  if (!auth.ok) return fail(auth.error);

  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = parseRole(formData);

  if (!name) return fail("Enter the person's full name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Enter a valid email address.");
  // The backend requires 8; 10 is this team's own floor and there is no reason to
  // lower it just because the API would accept less.
  if (password.length < 10) return fail("A password must be at least 10 characters.");

  try {
    await createUser({
      email,
      password,
      fullName: name,
      role: backendRoleForRoles([role]),
    });
  } catch (error) {
    return fail(describeBackendError(error, "That account could not be created."));
  }

  refreshEverything();
  return ok(`${name} can now sign in with ${email}.`);
}

export async function updateUserRolesAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("users:manage");
  if (!auth.ok) return fail(auth.error);

  const userId = text(formData, "user_id");
  const role = parseRole(formData);

  try {
    const updated = await updateUser(userId, { role: backendRoleForRoles([role]) });
    refreshEverything();
    return ok(`Role updated for ${updated.fullName}.`);
  } catch (error) {
    return fail(describeBackendError(error, "That role could not be changed."));
  }
}

export async function setUserActiveAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorize("users:manage");
  if (!auth.ok) return fail(auth.error);

  const userId = text(formData, "user_id");
  const active = text(formData, "active") === "true";

  // Locking yourself out is a local concern the backend cannot judge: it only sees
  // a valid admin token asking to disable an account, which is a legitimate request.
  const session = await getCurrentUser();
  if (session?.id === userId && !active) {
    return fail("You cannot deactivate your own account.");
  }

  try {
    const updated = await updateUser(userId, { active });
    refreshEverything();
    return ok(`${updated.fullName} was ${active ? "restored" : "deactivated"}.`);
  } catch (error) {
    return fail(describeBackendError(error, "That account could not be changed."));
  }
}
/** Used by the UI to decide whether to render an edit affordance at all. */
export async function currentUserCan(capability: Parameters<typeof can>[1]) {
  const user = await getCurrentUser();
  return can(user, capability);
}
