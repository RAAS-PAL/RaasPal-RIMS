import "server-only";

import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CAPABILITY_DENIAL, can, type Capability } from "./rbac";
import type { Role, SessionUser, UserRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSION_COOKIE = "rims_session";
const SESSION_MAX_AGE = 60 * 60 * 12; // one working day

/* ---------------------------------------------------------------------------
   Hashing
--------------------------------------------------------------------------- */

function scrypt(secret: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(secret.normalize("NFKC"), salt, 32, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashSecret(secret: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(secret, salt);
  return `${salt}:${key.toString("hex")}`;
}

async function verifySecret(secret: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const key = await scrypt(secret, salt);
  const expectedBuffer = Buffer.from(expected, "hex");
  if (expectedBuffer.length !== key.length) return false;
  return crypto.timingSafeEqual(key, expectedBuffer);
}

/* ---------------------------------------------------------------------------
   Account store
--------------------------------------------------------------------------- */

/**
 * Seed accounts, created the first time the app runs. The shared password and
 * the PINs are printed in the README — change them before this leaves your
 * network, and delete data/users.json to re-seed.
 */
const SEED_ACCOUNTS: {
  username: string;
  name: string;
  email: string;
  roles: Role[];
  warehouse: string;
  password: string;
  pin: string;
}[] = [
  {
    username: "swanhtetag01",
    name: "Swan Htet Aung",
    email: "swan.h@raaspal.com",
    roles: ["admin", "editor"],
    warehouse: "BKK-WH01",
    password: "Raas1234@Pal",
    pin: "314159",
  },
  {
    username: "nattapong",
    name: "Nattapong Sriwichai",
    email: "nattapong@raaspal.com",
    roles: ["admin"],
    warehouse: "BKK-WH01",
    password: "Raaspal#2026",
    pin: "730154",
  },
  {
    username: "pimchanok",
    name: "Pimchanok Ratanapon",
    email: "pimchanok@raaspal.com",
    roles: ["editor"],
    warehouse: "CNX-WH02",
    password: "Raaspal#2026",
    pin: "265913",
  },
  {
    username: "somchai",
    name: "Somchai Thanakit",
    email: "somchai@raaspal.com",
    roles: ["viewer"],
    warehouse: "PKT-WH03",
    password: "Raaspal#2026",
    pin: "118427",
  },
];

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => {});
  return run;
}

async function seedUsers(): Promise<UserRecord[]> {
  const createdAt = new Date().toISOString();
  return Promise.all(
    SEED_ACCOUNTS.map(async (account, index) => ({
      id: `u-${(index + 1).toString().padStart(3, "0")}`,
      username: account.username,
      name: account.name,
      email: account.email,
      roles: account.roles,
      warehouse: account.warehouse,
      passwordHash: await hashSecret(account.password),
      pinHash: await hashSecret(account.pin),
      active: true,
      createdAt,
      lastSignInAt: null,
    })),
  );
}

async function loadUsers(): Promise<UserRecord[]> {
  try {
    const contents = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(contents) as UserRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("empty");
    return parsed;
  } catch {
    const seeded = await seedUsers();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(USERS_FILE, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
}

async function saveUsers(users: UserRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function listUsers(): Promise<UserRecord[]> {
  return loadUsers();
}

export async function mutateUsers<T>(
  mutate: (users: UserRecord[]) => { users: UserRecord[]; result: T },
): Promise<T> {
  return enqueue(async () => {
    const users = await loadUsers();
    const { users: next, result } = mutate(users);
    await saveUsers(next);
    return result;
  });
}

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    roles: user.roles,
    warehouse: user.warehouse,
  };
}

/* ---------------------------------------------------------------------------
   Session cookie — an HMAC-signed "<userId>.<issuedAt>.<signature>".
--------------------------------------------------------------------------- */

function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET must be set to at least 16 characters in production.",
    );
  }
  return "rims-development-secret-do-not-ship";
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
}

function issueToken(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string): { userId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, issuedAt, signature] = parts;
  const expected = sign(`${userId}.${issuedAt}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Date.now() - Number(issuedAt) > SESSION_MAX_AGE * 1000) return null;
  return { userId };
}

export async function startSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, issueToken(userId), {
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

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const parsed = readToken(token);
  if (!parsed) return null;
  const users = await loadUsers();
  const user = users.find((candidate) => candidate.id === parsed.userId);
  if (!user || !user.active) return null;
  return toSessionUser(user);
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

export async function signIn(
  username: string,
  password: string,
): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const users = await loadUsers();
  const user = users.find(
    (candidate) => candidate.username.toLowerCase() === username.trim().toLowerCase(),
  );
  /* Always run a hash so a missing username costs the same as a wrong
     password and cannot be detected by timing. */
  const stored = user?.passwordHash ?? (await hashSecret("no-such-account"));
  const matches = await verifySecret(password, stored);
  if (!user || !matches) {
    return { ok: false, error: "That username and password do not match." };
  }
  if (!user.active) {
    return { ok: false, error: "This account is deactivated. Ask an admin to restore it." };
  }
  await mutateUsers((all) => ({
    users: all.map((candidate) =>
      candidate.id === user.id
        ? { ...candidate, lastSignInAt: new Date().toISOString() }
        : candidate,
    ),
    result: null,
  }));
  return { ok: true, user };
}

/**
 * The authority check that guards every write. It confirms the session is
 * live, that the account still holds the capability, and that whoever is at
 * the keyboard knows the account's PIN.
 */
export async function authorize(
  capability: Capability,
  pin: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const session = await getCurrentUser();
  if (!session) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }
  if (!can(session, capability)) {
    return { ok: false, error: CAPABILITY_DENIAL[capability] };
  }
  const trimmed = pin.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter your PIN to confirm this change." };
  }
  const users = await loadUsers();
  const record = users.find((candidate) => candidate.id === session.id);
  if (!record) {
    return { ok: false, error: "Your account is no longer available." };
  }
  if (!(await verifySecret(trimmed, record.pinHash))) {
    return { ok: false, error: "That PIN is not correct. Nothing was changed." };
  }
  return { ok: true, user: session };
}

export async function changeOwnPin(
  currentPin: string,
  nextPin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: "Your session has expired. Sign in again." };
  if (!/^\d{6}$/.test(nextPin)) {
    return { ok: false, error: "A PIN must be exactly six digits." };
  }
  const users = await loadUsers();
  const record = users.find((candidate) => candidate.id === session.id);
  if (!record || !(await verifySecret(currentPin, record.pinHash))) {
    return { ok: false, error: "That PIN is not correct. Nothing was changed." };
  }
  const pinHash = await hashSecret(nextPin);
  await mutateUsers((all) => ({
    users: all.map((candidate) =>
      candidate.id === session.id ? { ...candidate, pinHash } : candidate,
    ),
    result: null,
  }));
  return { ok: true };
}
