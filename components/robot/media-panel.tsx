"use client";

import { FileText, ImageIcon, ExternalLink } from "lucide-react";

import { updateMediaAction } from "@/lib/actions";
import type { Robot } from "@/lib/types";
import { Editable, EditForm, EditTrigger, EditView } from "@/components/ui/editable";
import { Field, TextInput } from "@/components/ui/field";
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { RobotImage } from "./robot-image";

export function MediaPanel({
  robot,
  canEdit,
}: {
  robot: Robot;
  canEdit: boolean;
}) {
  return (
    <Editable canEdit={canEdit} reason="Changing media needs the Editor or Admin role.">
      <Panel>
        <PanelHeader>
          <PanelTitle
            eyebrow="Assets"
            hint="The photograph shown across the catalogue and the brochure sales staff send out."
            icon={<ImageIcon size={16} aria-hidden />}
          >
            Photo and brochure
          </PanelTitle>
          <PanelActions>
            <EditTrigger>Edit media</EditTrigger>
          </PanelActions>
        </PanelHeader>

        <EditView>
          <PanelBody className="grid gap-4 sm:grid-cols-[13rem_minmax(0,1fr)]">
            <RobotImage
              name={robot.name}
              category={robot.category}
              src={robot.image}
              className="aspect-4/3 rounded-md border border-line"
            />
            <div className="min-w-0 space-y-3">
              <Detail label="Photograph">
                {robot.image ? (
                  <span className="break-all font-mono text-[0.75rem]">{robot.image}</span>
                ) : (
                  <span className="text-muted">
                    None set. Drop{" "}
                    <code className="rounded bg-inset px-1 py-0.5 font-mono text-[0.6875rem]">
                      {robot.slug}.webp
                    </code>{" "}
                    into <code className="font-mono text-[0.6875rem]">public/robots/</code>{" "}
                    and it is picked up automatically, or set a path here.
                  </span>
                )}
              </Detail>
              <Detail label="Brochure">
                {robot.brochure ? (
                  <a
                    href={robot.brochure}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[var(--brand-ink)] underline-offset-4 hover:underline"
                  >
                    Open the product one-pager
                    <ExternalLink size={13} aria-hidden />
                  </a>
                ) : (
                  <span className="text-muted">
                    No brochure linked. Sales staff will fall back to the
                    specification table below.
                  </span>
                )}
              </Detail>
            </div>
          </PanelBody>
        </EditView>

        <EditForm
          action={updateMediaAction}
          intent={`Save the photograph and brochure links for ${robot.name}`}
          detail={`${robot.name} · ${robot.modelId}`}
          submitLabel="Save media"
        >
          <PanelBody>
            <input type="hidden" name="slug" value={robot.slug} />
            <div className="grid gap-4">
              <Field
                label="Photograph path or URL"
                htmlFor="image"
                hint={`Leave empty to fall back to public/robots/${robot.slug}.webp, or to the category drawing if no file is there.`}
              >
                <TextInput
                  id="image"
                  name="image"
                  defaultValue={robot.image ?? ""}
                  placeholder={`/robots/${robot.slug}.webp`}
                  className="font-mono text-[0.8125rem]"
                />
              </Field>
              <Field
                label="Brochure path or URL"
                htmlFor="brochure"
                hint="A PDF in public/brochures/ or a link to the manufacturer's page."
              >
                <TextInput
                  id="brochure"
                  name="brochure"
                  defaultValue={robot.brochure ?? ""}
                  placeholder={`/brochures/${robot.slug}.pdf`}
                  className="font-mono text-[0.8125rem]"
                />
              </Field>
            </div>
          </PanelBody>
        </EditForm>
      </Panel>
    </Editable>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-subtle px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-muted">
        <FileText size={11} aria-hidden />
        {label}
      </p>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed">{children}</p>
    </div>
  );
}
