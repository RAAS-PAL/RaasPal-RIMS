import { AppShell, type NavSummary } from "@/components/shell/app-shell";
import type { RobotIndexEntry } from "@/components/shell/command-palette";
import { ToastProvider } from "@/components/ui/toast";
import { signOutAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { CATEGORY_ORDER } from "@/lib/catalog";
import { listRobots } from "@/lib/store";
import { summarizeStock, type CategoryId } from "@/lib/types";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const robots = await listRobots();

  const counts = Object.fromEntries(
    CATEGORY_ORDER.map((id) => [
      id,
      robots.filter((robot) => robot.category === id).length,
    ]),
  ) as Record<CategoryId, number>;

  const nav: NavSummary = {
    total: robots.length,
    counts,
    attention: robots.filter(
      (robot) => summarizeStock(robot).state !== "in-stock",
    ).length,
  };

  /* A light index for the command palette — enough to search and rank, not the
     whole catalogue shipped to the browser. */
  const index: RobotIndexEntry[] = [...robots]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((robot) => ({
      slug: robot.slug,
      name: robot.name,
      modelId: robot.modelId,
      category: robot.category,
      onHand: summarizeStock(robot).onHand,
    }));

  return (
    <ToastProvider>
      <AppShell user={user} nav={nav} robots={index} signOut={signOutAction}>
        {children}
      </AppShell>
    </ToastProvider>
  );
}
