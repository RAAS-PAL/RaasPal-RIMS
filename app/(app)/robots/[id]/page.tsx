import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RelatedParts } from "@/components/inventory/related-parts";
import { RobotSummary } from "@/components/robot/robot-summary";
import { RobotEditSection } from "@/components/robot/robot-edit-section";
import { ButtonLink } from "@/components/ui/button";
import { Panel, PanelBody } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { ROBOT_TYPE_LABELS } from "@/lib/backend-types";
import { can } from "@/lib/rbac";
import { getRobotStockEntry, listInventoryItems } from "@/lib/stock-data";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const entry = await getRobotStockEntry(id);
  return { title: entry?.displayName ?? "Robot" };
}

/**
 * One robot: what the record holds, then the form to change it.
 *
 * <p>Read-only accounts get the same page minus the form. They used to get a single
 * line of text in an empty state, which meant a warehouse manager without the
 * Inventory role could not see the photo, the location or the note — a record they
 * are allowed to read, made unreadable by the way the page was built.
 */
export default async function RobotDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await props.params;

  const entry = await getRobotStockEntry(id);
  if (!entry) notFound();

  // Fetched after the 404 check rather than in parallel: there is no point asking
  // for the parts of a robot that does not exist.
  const parts = await listInventoryItems({ robotStockId: id });

  const canWrite = can(user, "stock:write");

  return (
    <>
      <PageHeader
        eyebrow="Warehouse"
        title={entry.displayName}
        description={
          canWrite
            ? "Everything the warehouse records about this robot. Changes are confirmed before they are saved."
            : "Everything the warehouse records about this robot."
        }
        trail={[
          { label: "Dashboard", href: "/" },
          { label: "Robots", href: "/robots" },
          // The type link comes back to the list already filtered, which is where
          // someone who followed a sidebar link in was a moment ago.
          { label: ROBOT_TYPE_LABELS[entry.robotType], href: `/robots?type=${entry.robotType}` },
          { label: entry.displayName },
        ]}
      >
        <ButtonLink href="/robots" variant="secondary">
          Back to robots
        </ButtonLink>
      </PageHeader>

      <div className="space-y-5">
        <RobotSummary entry={entry} />

        <RelatedParts items={parts} robotName={entry.displayName} />

        {canWrite ? (
          <RobotEditSection entry={entry} canEdit={canWrite} />
        ) : (
          <Panel>
            <PanelBody>
              <p className="flex items-start gap-2.5 text-[0.8125rem] text-muted">
                <ShieldAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
                Changing stock needs the Inventory role. Ask an administrator if you
                need to record what this robot holds.
              </p>
            </PanelBody>
          </Panel>
        )}
      </div>
    </>
  );
}
