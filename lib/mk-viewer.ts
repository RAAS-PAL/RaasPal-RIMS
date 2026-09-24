import "server-only";

import { redirect } from "next/navigation";

import { BackendError } from "./backend";

/**
 * Runs a read for MK's view, sending them back to the PIN screen when their session has
 * ended (expired, signed out, or the PIN was changed) instead of showing an error page.
 */
export async function asMkViewer<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof BackendError && (error.status === 401 || error.status === 429)) redirect("/mk");
    throw error;
  }
}
