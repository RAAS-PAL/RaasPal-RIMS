import { fetchBackendBinary } from "@/lib/backend";

/**
 * Serves a robot or part photo to the browser.
 *
 * <p>RIMS talks to the backend only from the server, with the JWT in an httpOnly
 * cookie the browser cannot read. An `<img src>` is a plain browser request: it
 * carries no Authorization header and cannot be given one. So the image cannot be
 * fetched from the backend directly by the page — this same-origin handler stands
 * in front, adds the token server-side, and streams the bytes through.
 *
 * <p>Photos used to travel inside list responses as base64. That made every list a
 * multi-megabyte payload — 3.8 MB for 92 robots, on every page in RIMS, because the
 * layout reads the robot list for sidebar counts. Here each image has its own URL,
 * so they load in parallel, lazily, and stay in the browser cache.
 */

const UPSTREAM: Record<string, string> = {
  robot: "/api/v1/inventory/robot-stock",
  part: "/api/v1/inventory/items",
  "mk-part": "/api/v1/mk-stock/parts",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await context.params;

  const base = UPSTREAM[kind];
  // Allowlisted rather than interpolated: `kind` comes from the URL, and building a
  // backend path out of it unchecked would let a crafted URL reach other endpoints.
  if (!base) return new Response("Not found", { status: 404 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const upstream = await fetchBackendBinary(`${base}/${id}/image`);

  if (!upstream.ok) {
    // A robot with no photo is a 404 here, which is what an <img> expects — it
    // falls back to its own placeholder rather than rendering a broken response.
    return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      // Long-lived and private. Long-lived is only safe because callers version the
      // URL with the row updatedAt (see lib/image-url.ts) — the path alone is keyed on
      // the id and does not change when a photo is replaced. Private because this is
      // warehouse data behind a session, not something a shared cache should hold.
      "Cache-Control": "private, max-age=31536000",
    },
  });
}
