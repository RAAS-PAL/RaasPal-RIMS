"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * A record that reads as a record until someone chooses to change it.
 *
 * <p>Both detail pages used to render their edit form inline, so opening a robot or a
 * part put you in a page full of inputs with a Save button — indistinguishable from
 * having already started editing. That is the wrong default: these pages are read far
 * more often than they are written, and a form is a poor way to read anything.
 *
 * <p>Read-only accounts never see the button, so for them the page is simply a page.
 * That is presentation, not protection — the backend rejects their writes regardless.
 *
 * @param render receives a callback that closes the editor, so the form can collapse
 *               the section on save or cancel. A callback rather than a redirect path
 *               because this component is a client boundary, which the server pages
 *               rendering the forms were not.
 */
export function EditSection({
  canEdit,
  label = "Edit",
  render,
}: {
  canEdit: boolean;
  label?: string;
  render: (close: () => void) => ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (!canEdit) return null;

  if (!editing) {
    return (
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          <Pencil size={15} aria-hidden />
          {label}
        </Button>
      </div>
    );
  }

  return (
    <>
      {render(() => {
        setEditing(false);
        // The values above the form came from the server render, so without this the
        // page would collapse back to the pre-edit record and look as if the save
        // had not happened.
        router.refresh();
      })}
    </>
  );
}
