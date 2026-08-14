import { AppShell, type NavSummary } from "@/components/shell/app-shell";
import type { RobotIndexEntry } from "@/components/shell/command-palette";
import { ToastProvider } from "@/components/ui/toast";
import { signOutAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { ROBOT_TYPES, type BackendRobotType } from "@/lib/backend-types";
import { getInventorySummary, listRobotStock } from "@/lib/stock-data";




export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  // Both feed the sidebar, neither depends on the other.
  const [robots, summary] = await Promise.all([listRobotStock(), getInventorySummary()]);

  // Counted by units held, not by number of rows: "Cleaning 14" should mean fourteen
  // machines, not fourteen records that might each hold one or forty.
  const counts = Object.fromEntries(
    ROBOT_TYPES.map((type) => [
      type,
      robots
        .filter((robot) => robot.robotType === type)
        .reduce((sum, robot) => sum + robot.quantity, 0),
    ]),
  ) as Record<BackendRobotType, number>;

  const nav: NavSummary = {
    total: robots.reduce((sum, robot) => sum + robot.quantity, 0),
    counts,
    // The bell means "needs ordering", which is a parts question — robot entries
    // carry no reorder point, so counting them here would be inventing a threshold.
    attention: summary.lowStockCount,
  };

  /* A light index for the command palette — enough to search and rank, not the
     whole record shipped to the browser. */
  const index: RobotIndexEntry[] = robots.map((robot) => ({
    id: robot.id,
    name: robot.displayName,
    robotType: robot.robotType,
    quantity: robot.quantity,
  }));

  return (
    <ToastProvider>
      <AppShell user={user} nav={nav} robots={index} signOut={signOutAction}>
        {children}
      </AppShell>
    </ToastProvider>
  );
}
