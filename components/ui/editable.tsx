"use client";

import { Lock, Pencil } from "lucide-react";
import { createContext, use, useMemo, useState, type ReactNode } from "react";

import type { ActionState } from "@/lib/action-state";
import { Button } from "./button";
import { AuthorizedForm } from "./authorized-form";

/**
 * A panel that reads as a record until someone with the right role turns it
 * into a form. The provider owns the one piece of state — whether we are
 * editing — so the trigger, the read view and the form stay siblings and none
 * of them needs to know how the others are built.
 */
interface EditableApi {
  editing: boolean;
  canEdit: boolean;
  /** Why the edit control is unavailable, shown on the disabled button. */
  reason: string;
  start: () => void;
  stop: () => void;
}

const EditableContext = createContext<EditableApi | null>(null);

function useEditable(): EditableApi {
  const api = use(EditableContext);
  if (!api) throw new Error("Edit parts must be used inside <Editable>.");
  return api;
}

export function Editable({
  canEdit,
  reason = "You do not have permission to change this.",
  children,
}: {
  canEdit: boolean;
  reason?: string;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const api = useMemo<EditableApi>(
    () => ({
      editing,
      canEdit,
      reason,
      start: () => setEditing(true),
      stop: () => setEditing(false),
    }),
    [editing, canEdit, reason],
  );
  return <EditableContext value={api}>{children}</EditableContext>;
}

/** The Edit button. Stays visible but disabled when the role is missing, so
 *  people learn what their account can do instead of wondering. */
export function EditTrigger({ children = "Edit" }: { children?: ReactNode }) {
  const { editing, canEdit, reason, start } = useEditable();
  if (editing) return null;
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={start}
      disabled={!canEdit}
      title={canEdit ? undefined : reason}
    >
      {canEdit ? <Pencil size={14} aria-hidden /> : <Lock size={14} aria-hidden />}
      {children}
    </Button>
  );
}

export function EditView({ children }: { children: ReactNode }) {
  const { editing } = useEditable();
  if (editing) return null;
  return <>{children}</>;
}

export function EditForm({
  action,
  intent,
  detail,
  submitLabel,
  children,
  className,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  intent: string;
  detail: string;
  submitLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  const { editing, stop } = useEditable();
  if (!editing) return null;
  return (
    <AuthorizedForm
      action={action}
      intent={intent}
      detail={detail}
      submitLabel={submitLabel}
      onCancel={stop}
      onDone={stop}
      className={className}
    >
      {children}
    </AuthorizedForm>
  );
}
