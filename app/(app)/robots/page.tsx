import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogToolbar } from "@/components/robot/catalog-toolbar";
import { RobotCard } from "@/components/robot/robot-card";
import { RobotTable } from "@/components/robot/robot-table";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Panel, PanelFlush, SectionHeading } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { readClock } from "@/lib/clock";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/catalog";
import { num } from "@/lib/format";
import { applyCatalogQuery, parseCatalogQuery } from "@/lib/filter";
import { listRobots } from "@/lib/store";
import type { Robot } from "@/lib/types";

export const metadata: Metadata = { title: "Robot catalogue" };

export default async function CatalogPage(props: PageProps<"/robots">) {
  await requireUser();
  const params = await props.searchParams;
  const query = parseCatalogQuery(params);
  const robots = await listRobots();
  const results = applyCatalogQuery(robots, query);
  const now = await readClock();

  /* Grouping only helps when you are browsing the whole catalogue. Once a
     filter narrows it, a flat list is faster to read. */
  const grouped = !query.category && !query.q && !query.stock;

  const heading = query.category
    ? CATEGORY_META[query.category].label
    : "Robot catalogue";
  const description = query.category
    ? CATEGORY_META[query.category].blurb
    : "Every robot RaasPal supplies, with its current stock position and buy-off price.";

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title={heading}
        description={description}
        trail={
          query.category
            ? [
                { label: "Dashboard", href: "/" },
                { label: "Robot catalogue", href: "/robots" },
                { label: CATEGORY_META[query.category].label },
              ]
            : [{ label: "Dashboard", href: "/" }, { label: "Robot catalogue" }]
        }
      >
        <ButtonLink href="/inventory" variant="secondary">
          Update stock
        </ButtonLink>
      </PageHeader>

      <Suspense fallback={<div className="mb-5 h-[6.5rem] rounded-lg border border-line bg-surface" />}>
        <CatalogToolbar resultCount={results.length} />
      </Suspense>

      {results.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<SearchX size={26} aria-hidden />}
            title="No robots match these filters"
            action={
              <ButtonLink href="/robots" variant="secondary" size="sm">
                Clear filters
              </ButtonLink>
            }
          >
            Try a shorter search term, or widen the category and stock filters.
            Model IDs such as BEETLE or ZARA-L300 also match.
          </EmptyState>
        </Panel>
      ) : query.view === "table" ? (
        <Panel>
          <PanelFlush>
            <RobotTable robots={results} now={now} />
          </PanelFlush>
        </Panel>
      ) : grouped ? (
        <div className="space-y-9">
          {CATEGORY_ORDER.map((id) => {
            const members = results.filter((robot) => robot.category === id);
            if (members.length === 0) return null;
            return (
              <section key={id} aria-labelledby={`category-${id}`}>
                <SectionHeading
                  eyebrow={`${num(members.length)} ${members.length === 1 ? "model" : "models"}`}
                  title={CATEGORY_META[id].label}
                  hint={CATEGORY_META[id].blurb}
                >
                  <ButtonLink href={`/robots?category=${id}`} variant="ghost" size="sm">
                    Filter to {CATEGORY_META[id].label.toLowerCase()}
                  </ButtonLink>
                </SectionHeading>
                <CardGrid robots={members} />
              </section>
            );
          })}
        </div>
      ) : (
        <CardGrid robots={results} />
      )}
    </>
  );
}

function CardGrid({ robots }: { robots: Robot[] }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {robots.map((robot) => (
        <RobotCard key={robot.slug} robot={robot} />
      ))}
    </div>
  );
}
