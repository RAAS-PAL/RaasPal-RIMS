import { Boxes, History, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdjustStock } from "@/components/inventory/adjust-stock";
import { EditPartForm } from "@/components/inventory/edit-part-form";
import { StockBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Panel, PanelBody, PanelFlush, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat";
import { requireUser } from "@/lib/auth";
import { MOVEMENT_LABELS } from "@/lib/backend-types";
import { num, stamp } from "@/lib/format";
import { can } from "@/lib/rbac";
import { getInventoryItem, listItemMovements, listRobotStock } from "@/lib/stock-data";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const item = await getInventoryItem(id);
  return { title: item?.name ?? "Part" };
}

/**
 * One part: what it is, how many there are, which robots take it, and how the
 * count reached the number shown.
 *
 * <p>The movement history is the point of the page. A balance on its own invites
 * "that looks wrong" with no way to check; the ledger answers it.
 */
export default async function PartDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await props.params;

  const item = await getInventoryItem(id);
  if (!item) notFound();

  const canWrite = can(user, "stock:write");

  // The robot list is only needed to render the edit picker, so a read-only
  // account does not pay for it.
  const [movements, robots] = await Promise.all([
    listItemMovements(id),
    canWrite ? listRobotStock() : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title={item.name}
        description={item.sku}
        trail={[
          { label: "Dashboard", href: "/" },
          { label: "Inventory", href: "/inventory" },
          { label: item.name },
        ]}
      >
        <ButtonLink href="/inventory" variant="secondary">
          Back to inventory
        </ButtonLink>
      </PageHeader>

      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="On hand" value={num(item.quantityOnHand)} />
          <StatTile label="Reorder at" value={num(item.reorderPoint)} />
        </div>

        <Panel>
          <PanelHeader>
            <PanelTitle
              icon={<Boxes size={15} aria-hidden />}
              hint="The warehouse robots this part fits. Empty means it is universal."
            >
              Fits these robots
            </PanelTitle>
            <StockBadge
              state={
                item.quantityOnHand === 0
                  ? "out-of-stock"
                  : item.lowStock
                    ? "low-stock"
                    : "in-stock"
              }
            />
          </PanelHeader>
          <PanelBody>
            {item.robots.length === 0 ? (
              <p className="text-[0.8125rem] text-muted">
                Not linked to any robot — treated as a universal item.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {item.robots.map((robot) => (
                  <li key={robot.id}>
                    <Link
                      href={`/robots/${robot.id}`}
                      className="inline-flex rounded-md border border-line px-2.5 py-1 text-[0.8125rem] transition-colors hover:bg-inset"
                    >
                      {robot.displayName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>

        {canWrite ? (
          <>
            <Panel>
              <PanelHeader>
                <PanelTitle hint="Stock only moves through a recorded movement, never by typing a total.">
                  Adjust stock
                </PanelTitle>
                <AdjustStock item={item} />
              </PanelHeader>
            </Panel>

            <Panel>
              <PanelHeader>
                <PanelTitle hint="Details and robot links. The count is changed above.">
                  Edit part
                </PanelTitle>
              </PanelHeader>
              <PanelBody>
                <EditPartForm item={item} robots={robots} />
              </PanelBody>
            </Panel>
          </>
        ) : (
          <Panel>
            <PanelBody>
              <p className="flex items-start gap-2.5 text-[0.8125rem] text-muted">
                <ShieldAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
                Changing parts needs the Inventory role. Ask an administrator if you
                need to edit this record.
              </p>
            </PanelBody>
          </Panel>
        )}

        <Panel>
          <PanelHeader>
            <PanelTitle
              icon={<History size={15} aria-hidden />}
              hint="Every change to the count, newest first."
            >
              Movement history
            </PanelTitle>
          </PanelHeader>

          {movements.length === 0 ? (
            <EmptyState icon={<History size={22} aria-hidden />} title="No movements yet">
              The count changes only through a recorded receipt, issue or adjustment.
            </EmptyState>
          ) : (
            <PanelFlush>
              <table className="w-full text-left text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-faint">
                    <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">When</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Type</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Change</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Balance</th>
                    <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="align-top hover:bg-subtle">
                      <td className="px-4 py-3 text-muted sm:px-5">{stamp(movement.createdAt)}</td>
                      <td className="px-3 py-3">{MOVEMENT_LABELS[movement.movementType]}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        {/* The sign carries the direction, so it is shown rather
                            than reformatted into words. */}
                        {movement.quantityChange > 0 ? "+" : ""}
                        {num(movement.quantityChange)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-muted">
                        {num(movement.balanceAfter)}
                      </td>
                      <td className="px-4 py-3 text-muted sm:px-5">{movement.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelFlush>
          )}
        </Panel>
      </div>
    </>
  );
}
