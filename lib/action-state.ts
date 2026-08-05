/** Shared result shape for every server action, so forms handle one contract. */
export interface ActionState {
  status: "idle" | "ok" | "error";
  message: string;
}

export const IDLE: ActionState = { status: "idle", message: "" };

export const ok = (message: string): ActionState => ({ status: "ok", message });

export const fail = (message: string): ActionState => ({
  status: "error",
  message,
});
