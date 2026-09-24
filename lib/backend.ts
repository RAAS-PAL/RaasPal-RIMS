import "server-only";

import { cookies } from "next/headers";

/**
 * The RaasPal backend, as RIMS sees it.
 *
 * <p>Every call runs on the server. The JWT lives in an httpOnly cookie the browser
 * cannot read, and the backend's address stays in a non-public env var, so the API
 * is never addressable from the client at all. That is stricter than the operations
 * console, which calls the backend directly from the browser via NEXT_PUBLIC_API_URL
 * — and it means RIMS needs no CORS entry on the backend.
 */

const BASE_URL = process.env.RAASPAL_API_URL ?? "http://localhost:8080";

export const SESSION_COOKIE = "rims_token";

/** The backend wraps every payload as { success, message, data }. */
interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

/**
 * Turns a thrown error into something worth showing an operator.
 *
 * <p>The backend's own message is preferred because it carries the detail that
 * matters — "Already registered: GS-001, GS-002" or "This is the last active
 * administrator" — rather than a status code. Anything that is not a BackendError
 * is a network or programming fault, and the caller's fallback is used instead of
 * leaking an internal message into the interface.
 */
export function describeBackendError(error: unknown, fallback: string): string {
  if (error instanceof BackendError) return error.message;
  return fallback;
}

/**
 * True when a 404 means "this endpoint does not exist", not "this record does not".
 *
 * <p>Spring answers an unmatched path by falling through to the static resource
 * handler, which 404s with "No static resource api/v1/...". That is indistinguishable
 * by status code from a genuine missing row, and the two need opposite handling: a
 * missing row is a not-found page, a missing endpoint is a backend running older code
 * than the frontend expects. Treating the second as the first is how "restart the
 * API" spends an afternoon disguised as "that robot was deleted".
 */
export function isMissingEndpoint(error: unknown): boolean {
  return (
    error instanceof BackendError &&
    error.status === 404 &&
    error.message.includes("No static resource")
  );
}

async function tokenFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Set for sign-in, which has no token yet. */
  token?: string | null;
  /** Reads are not cached: stock counts that lag reality are worse than a slow page. */
  revalidate?: number | false;
  /** Extra headers, e.g. MK's view token on the public MK stock endpoints. */
  headers?: Record<string, string>;
}

export async function callBackend<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, revalidate = false } = options;
  const token = options.token !== undefined ? options.token : await tokenFromCookie();

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: revalidate === false ? "no-store" : undefined,
    next: revalidate === false ? undefined : { revalidate },
  });

  const text = await response.text();
  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
  } catch {
    // A non-JSON body means something upstream failed before the app ran —
    // a proxy error page, or the backend being down. Surface the status.
  }

  if (!response.ok) {
    // Prefer the backend's own message: it carries the useful detail, e.g.
    // "Already registered: GS-001, GS-002" rather than a bare 400.
    const message =
      (payload as { message?: string } | null)?.message ??
      (response.status === 401
        ? "Your session has expired. Sign in again."
        : `Request failed (${response.status})`);
    throw new BackendError(message, response.status);
  }

  return (payload?.data ?? null) as T;
}

/**
 * Fetches a binary response from the backend, authenticated, for a route handler
 * to stream on to the browser.
 *
 * <p>Needed because {@link callBackend} parses JSON, and images are not JSON. More
 * importantly, an {@code <img src>} is a plain browser request that carries no
 * Authorization header and cannot read the httpOnly session cookie's value — so the
 * browser cannot call the backend's image endpoints itself. A same-origin route
 * handler stands in front, adds the token server-side, and passes the bytes through.
 *
 * <p>Returns the upstream {@link Response} untouched so the caller can forward the
 * status, content type and cache headers rather than reconstructing them.
 */
export async function fetchBackendBinary(
  path: string,
  options: { token?: string | null; headers?: Record<string, string> } = {},
): Promise<Response> {
  const token = options.token !== undefined ? options.token : await tokenFromCookie();
  return fetch(`${BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    cache: "no-store",
  });
}
