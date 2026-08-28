/**
 * Where a stored photo is served from.
 *
 * <p>Not the backend directly: an `<img src>` carries no Authorization header and
 * cannot read the httpOnly session cookie, so it goes through a same-origin route
 * handler that adds the token server-side. See `app/api/image/[kind]/[id]/route.ts`.
 *
 * <p>`updatedAt` is what makes a replaced photo actually appear. The path is keyed on
 * the row id, which does not change when someone uploads a new picture, and both this
 * app and the backend send a year-long `Cache-Control` for it. Without a version in
 * the query the browser goes on showing the old photo for a year — which is exactly
 * what it did. Any edit to the row bumps the token, so at worst a rename re-fetches
 * one image; a stale photo is the failure that matters.
 */
export function imageUrl(
  kind: "robot" | "part",
  id: string,
  hasImage: boolean,
  updatedAt?: string | null,
): string | null {
  if (!hasImage) return null;

  const path = `/api/image/${kind}/${id}`;
  // Digits only: an ISO timestamp is legal in a query string, but this keeps the URL
  // readable in the network panel when someone is chasing a caching problem.
  const version = updatedAt ? updatedAt.replace(/[^0-9]/g, "") : "";
  return version ? `${path}?v=${version}` : path;
}
