import { fetchBackendBinary } from "@/lib/backend";
import { MK_TOKEN_HEADER, mkViewToken } from "@/lib/mk-stock";

/**
 * A part photo for MK's read-only view. Lives under /mk because MK's session cookie is
 * scoped to that path; sends MK's view token, never a staff login.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const token = await mkViewToken();
  if (!token) return new Response(null, { status: 401 });

  const upstream = await fetchBackendBinary(`/api/v1/public/mk-stock/parts/${id}/image`, {
    token: null,
    headers: { [MK_TOKEN_HEADER]: token },
  });
  if (!upstream.ok) return new Response(null, { status: upstream.status === 404 ? 404 : upstream.status === 401 ? 401 : 502 });
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000",
    },
  });
}
