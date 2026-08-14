import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BackendError, SESSION_COOKIE, callBackend } from "./backend";
import {
  rolesForBackendRole,
  type BackendRole,
  type BackendUser,
  type CreateUserRequest,
  type LoginResponse,
  type Paged,
} from "./backend-types";
import { CAPABILITY_DENIAL, can, type Capability } from "./rbac";
import type { SessionUser } from "./types";

/**
 * Identity comes from the Java backend. RIMS stores no passwords.
 *
 * <p>This replaces a self-contained system that hashed passwords with scrypt into
 * `data/users.json` and guarded every write with a six-digit PIN. That worked while
 * RIMS was standalone, but it meant two user databases for one set of people: an
 * account here could change stock while the backend had never heard of them, so
 * `stock_movements.created_by` recorded nothing usable.
 *
 * <p><strong>The PIN is gone.</strong> It was a second factor over a JSON file with
 * no other access control. Writes are now guarded by a signed JWT plus a server-side
 * role check on every endpoint — a stronger boundary than the PIN was, and one the
 * browser cannot talk its way around. If a confirmation step is wanted back for
 * destructive actions, it should be a re-authentication against the backend rather
 * than a secret RIMS keeps by itself.
 */

const SESSION_MAX_AGE = 60 * 60 * 12; // one working day, matching the JWT lifetime

/* ---------------------------------------------------------------------------
   Session
--------------------------------------------------------------------------- */

/**
 * The backend's JWT, in an httpOnly cookie.
 *
 * <p>httpOnly means client JavaScript cannot read it, so an XSS bug cannot exfiltrate
 * a working staff token. Every backend call is made server-side, so the browser never
 * needs it.
 */
export async function startSession(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Who is signed in, according to the backend.
 *
 * <p>Asks `/auth/me` on every call rather than trusting claims decoded from the
 * cookie. It costs a request, but it means a deactivated account or a changed role
 * takes effect immediately instead of lingering until the token expires — which for
 * a twelve-hour token is most of a working day.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  if (!store.get(SESSION_COOKIE)?.value) return null;

  try {
    const me = await callBackend<BackendUser>("/api/v1/auth/me");
    return me ? toSessionUser(me) : null;
  } catch (error) {
    // 401/403 means the token is expired, revoked, or the account is disabled —
    // all "not signed in". Anything else (backend down) must not silently read as
    // signed-out, or an outage would look like a mass logout and users would be
    // redirected into a login page that also cannot work.
    if (error instanceof BackendError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

/** For pages: sends anyone without a live session to sign in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/* ---------------------------------------------------------------------------
   Credentials
--------------------------------------------------------------------------- */

/**
 * Sign in against the backend.
 *
 * <p>The backend identifies people by email. RIMS used to ask for a username, so the
 * sign-in field now takes an email address — the seed accounts already followed
 * `somchai` / `somchai@raaspal.com`, so the change is small for anyone used to it.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !password) {
    return { ok: false, error: "Enter your email address and password." };
  }

  try {
    // token: null — there is no session yet, and sending a stale cookie from a
    // previous account would be confusing rather than helpful.
    const result = await callBackend<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: { email: trimmed, password },
      token: null,
    });

    if (!result?.accessToken || !result.user) {
      return { ok: false, error: "Sign-in failed. Try again." };
    }

    const user = toSessionUser(result.user);
    if (user.roles.length === 0) {
      // A CUSTOMER account authenticates fine against the backend but has no
      // business in the inventory system. Refuse here rather than admitting them
      // to an interface where every page is empty.
      return {
        ok: false,
        error: "This account does not have access to the inventory system.",
      };
    }

    await startSession(result.accessToken);
    return { ok: true, user };
  } catch (error) {
    if (error instanceof BackendError) {
      // 401 is a wrong email or password; the backend does not distinguish which,
      // and neither should we.
      return {
        ok: false,
        error:
          error.status === 401
            ? "That email and password do not match."
            : error.message,
      };
    }
    return { ok: false, error: "Could not reach the server. Try again." };
  }
}

/**
 * The authority check in front of every write.
 *
 * <p>No longer takes a PIN. It confirms a live session and that the account holds the
 * capability — and note that this is a *convenience*, not the enforcement point: the
 * backend re-checks the role on every endpoint. Passing this check and then being
 * refused by the API is possible and correct; the reverse is not.
 */
export async function authorize(
  capability: Capability,
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const session = await getCurrentUser();
  if (!session) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }
  if (!can(session, capability)) {
    return { ok: false, error: CAPABILITY_DENIAL[capability] };
  }
  return { ok: true, user: session };
}

/* ---------------------------------------------------------------------------
   Accounts
--------------------------------------------------------------------------- */

export async function listUsers(): Promise<BackendUser[]> {
  const page = await callBackend<Paged<BackendUser>>("/api/v1/users?page=0&size=200");
  return page?.content ?? [];
}

export async function createUser(request: CreateUserRequest): Promise<BackendUser> {
  return callBackend<BackendUser>("/api/v1/users", { method: "POST", body: request });
}

/** Change a role, a name, or whether the account can sign in. */
export async function updateUser(
  id: string,
  request: { fullName?: string; role?: BackendRole; active?: boolean },
): Promise<BackendUser> {
  return callBackend<BackendUser>(`/api/v1/users/${id}`, { method: "PATCH", body: request });
}

/* ---------------------------------------------------------------------------
   Mapping
--------------------------------------------------------------------------- */

export function toSessionUser(user: BackendUser): SessionUser {
  return {
    id: user.id,
    // The backend has no username. Deriving it from the email local part matches
    // the accounts this replaced (somchai / somchai@raaspal.com) and keeps the
    // interface reading the same.
    username: user.email.split("@")[0] ?? user.email,
    name: user.fullName,
    email: user.email,
    roles: rolesForBackendRole(user.role),
    // Vestigial. RIMS was designed around several warehouses; the backend records
    // one free-text location per unit instead, so there is no per-user home site to
    // report. Left as an empty string rather than inventing one.
    warehouse: "",
  };
}
