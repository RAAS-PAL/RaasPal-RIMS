import type { Role, SessionUser } from "./types";

/**
 * Capabilities, not roles, are what the UI and the server actions check. An
 * account holds one or more roles and is granted the union of their
 * capabilities, so an "admin + editor" account is simply an admin.
 */
export const CAPABILITIES = [
  "catalog:read",
  "content:write",
  "media:write",
  "price:write",
  "stock:write",
  "users:manage",
  "mkstock:write",
  "mkstock:pin",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * Roles now arrive from the backend, one per account, mapped in backend-types.ts:
 *   ADMIN → admin · INVENTORY_STAFF → editor · RAASPAL_TEAM → viewer
 *
 * `editor` gained `stock:write` as part of that. It previously could not change
 * numbers — only `admin` could — which meant a warehouse account had to be a full
 * admin, and would therefore also have been able to create accounts. Editor is now
 * "the warehouse role": it changes stock and content, and manages nothing else.
 */
const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  admin: [
    "catalog:read",
    "content:write",
    "media:write",
    "price:write",
    "stock:write",
    "users:manage",
    "mkstock:write",
    "mkstock:pin",
  ],
  // MK's spare parts are run by the whole internal team, so every RAAS PAL account can move
  // them - including viewers, who cannot touch RAAS PAL's own stock. MK's PIN is admin-only.
  editor: ["catalog:read", "content:write", "media:write", "stock:write", "mkstock:write"],
  viewer: ["catalog:read", "mkstock:write"],
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  editor: "Inventory",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: "Changes stock, prices and specifications, and manages accounts.",
  editor: "Receives robots, changes stock counts, specifications and media.",
  viewer: "Reads the catalogue and stock, and records MK spare parts. Cannot change RAAS PAL stock.",
};

export function capabilitiesOf(roles: Role[]): Set<Capability> {
  const granted = new Set<Capability>();
  for (const role of roles) {
    for (const capability of ROLE_CAPABILITIES[role] ?? []) {
      granted.add(capability);
    }
  }
  return granted;
}

export function can(
  user: Pick<SessionUser, "roles"> | null | undefined,
  capability: Capability,
): boolean {
  if (!user) return false;
  return capabilitiesOf(user.roles).has(capability);
}

/** Sorted most-privileged first, so badges read "Admin, Editor". */
export function sortRoles(roles: Role[]): Role[] {
  const order: Role[] = ["admin", "editor", "viewer"];
  return [...roles].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function describeRoles(roles: Role[]): string {
  return sortRoles(roles)
    .map((role) => ROLE_LABEL[role])
    .join(" · ");
}

/** Message shown when an action is blocked, naming the missing capability. */
export const CAPABILITY_DENIAL: Record<Capability, string> = {
  "catalog:read": "Your account cannot read the catalogue.",
  "content:write":
    "Changing specifications and descriptions needs the Editor or Admin role.",
  "media:write": "Changing media needs the Editor or Admin role.",
  "price:write": "Changing prices needs the Admin role.",
  "stock:write": "Changing stock counts needs the Admin role.",
  "users:manage": "Managing accounts needs the Admin role.",
  "mkstock:write": "Your account cannot change MK stock.",
  "mkstock:pin": "Setting MK's PIN needs the Admin role.",
};
