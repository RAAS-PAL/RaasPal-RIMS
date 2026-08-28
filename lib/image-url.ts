/**
 * Where a stored photo is served from.
 *
 * <p>Not the backend directly: an `<img src>` carries no Authorization header and
 * cannot read the httpOnly session cookie, so it goes through a same-origin route
 * handler that adds the token server-side. See `app/api/image/[kind]/[id]/route.ts`.
 */
export function imageUrl(kind: "robot" | "part", id: string, hasImage: boolean): string | null {
  return hasImage ? `/api/image/${kind}/${id}` : null;
}
