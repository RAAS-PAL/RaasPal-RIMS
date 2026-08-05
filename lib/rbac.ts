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
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  admin: [
    "catalog:read",
    "content:write",
    "media:write",
    "price:write",
    "stock:write",
    "users:manage",
  ],
  editor: ["catalog:read", "content:write", "media:write"],
  viewer: ["catalog:read"],
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: "Changes stock counts, prices and specifications, and manages accounts.",
  editor: "Changes specifications, descriptions and media. Cannot change numbers.",
  viewer: "Reads and exports the catalogue. Cannot change anything.",
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
};
