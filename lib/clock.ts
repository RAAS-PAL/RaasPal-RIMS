import "server-only";

/**
 * Reads the wall clock once per request, away from render, and hands the same
 * number to every "3 days ago" on the page. Server and client then agree, so
 * relative times do not shift under hydration.
 */
export async function readClock(): Promise<number> {
  return Date.now();
}
