import { SearchX } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return (
    <>
      <PageHeader
        eyebrow="Not found"
        title="That record does not exist"
        trail={[{ label: "Dashboard", href: "/" }, { label: "Not found" }]}
      />
      <Panel>
        <EmptyState
          icon={<SearchX size={26} aria-hidden />}
          title="Nothing here"
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ButtonLink href="/robots" variant="primary" size="sm">
                Browse the catalogue
              </ButtonLink>
              <ButtonLink href="/" variant="secondary" size="sm">
                Back to dashboard
              </ButtonLink>
            </div>
          }
        >
          The robot may have been removed, or the link may be out of date. Press
          Ctrl K to search by name or model ID.
        </EmptyState>
      </Panel>
    </>
  );
}
