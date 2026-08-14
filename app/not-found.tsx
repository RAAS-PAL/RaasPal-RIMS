import Link from "next/link";

/**
 * Rendered when a URL matches no route at all.
 *
 * <p>Deliberately worded differently from `(app)/not-found.tsx`, which is for a
 * request that reached a real page and found no such record. The two look identical
 * without this: an unmatched route falls back here rather than to the group's
 * boundary, so a dev server serving a stale route manifest is indistinguishable from
 * a deleted robot — which cost an afternoon of looking at the database and the API
 * when the address itself was the thing that did not exist.
 *
 * <p>This file carries its own markup because the root layout has no app shell; the
 * shell lives in the `(app)` group, which by definition was not matched.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[0.75rem] uppercase tracking-[0.11em] text-faint">
          404 · No such page
        </p>
        <h1 className="mt-3 text-[1.375rem] font-semibold tracking-[-0.01em]">
          That address does not exist
        </h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
          Nothing is served at this URL. If you followed a link from inside RIMS
          rather than typing it, the address is wrong rather than the record — check
          the link, and in development check that the route was picked up.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center rounded-md border border-line-strong bg-surface px-4 text-[0.8125rem] font-medium transition-colors hover:bg-inset"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
