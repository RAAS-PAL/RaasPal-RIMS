import { ArrowLeft, History } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActivityList } from "@/components/activity/activity-list";
import { HeroPanel } from "@/components/robot/hero-panel";
import { MediaPanel } from "@/components/robot/media-panel";
import { PricingPanel } from "@/components/robot/pricing-panel";
import { SpecsPanel } from "@/components/robot/specs-panel";
import { StockPanel } from "@/components/robot/stock-panel";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/page-header";
import {
  EmptyState,
  Panel,
  PanelFlush,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { requireUser } from "@/lib/auth";
import { readClock } from "@/lib/clock";
import { CATEGORY_META } from "@/lib/catalog";
import { can } from "@/lib/rbac";
import { getRobot, listActivityFor } from "@/lib/store";

export async function generateMetadata(
  props: PageProps<"/robots/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const robot = await getRobot(slug);
  if (!robot) return { title: "Robot not found" };
  return { title: robot.name, description: robot.tagline };
}

export default async function RobotDetailPage(
  props: PageProps<"/robots/[slug]">,
) {
  const user = await requireUser();
  const { slug } = await props.params;
  const robot = await getRobot(slug);
  if (!robot) notFound();

  const history = await listActivityFor(slug);
  const now = await readClock();
  const meta = CATEGORY_META[robot.category];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          trail={[
            { label: "Dashboard", href: "/" },
            { label: "Robot catalogue", href: "/robots" },
            { label: meta.label, href: `/robots?category=${robot.category}` },
            { label: robot.name },
          ]}
        />
        <ButtonLink
          href={`/robots?category=${robot.category}`}
          variant="secondary"
          size="sm"
        >
          <ArrowLeft size={14} aria-hidden />
          Back to {meta.label.toLowerCase()}
        </ButtonLink>
      </div>

      <div className="space-y-5">
        <HeroPanel robot={robot} canEdit={can(user, "content:write")} now={now} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="space-y-5">
            <PricingPanel robot={robot} canEdit={can(user, "price:write")} />
            <SpecsPanel robot={robot} canEdit={can(user, "content:write")} />
          </div>

          <div className="space-y-5">
            <StockPanel robot={robot} canEdit={can(user, "stock:write")} />
            <MediaPanel robot={robot} canEdit={can(user, "media:write")} />

            <Panel>
              <PanelHeader>
                <PanelTitle
                  eyebrow="Audit"
                  hint="Confirmed with a PIN by the person named."
                  icon={<History size={16} aria-hidden />}
                >
                  Change history
                </PanelTitle>
              </PanelHeader>
              {history.length === 0 ? (
                <EmptyState title="No changes recorded">
                  Edits to this robot will be listed here with who made them and when.
                </EmptyState>
              ) : (
                <PanelFlush className="max-h-[30rem] overflow-y-auto">
                  <ActivityList entries={history} now={now} showRobot={false} />
                </PanelFlush>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
