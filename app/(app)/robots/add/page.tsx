import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { RobotStockForm } from "@/components/robot/robot-stock-form";
import { EmptyState, Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const metadata: Metadata = { title: "Add a robot" };

export default async function AddRobotPage() {
  const user = await requireUser();

  // The backend refuses the write regardless of what renders; this exists so someone
  // without the capability gets an explanation rather than a form that only fails
  // once they have filled it in.
  if (!can(user, "stock:write")) {
    return (
      <>
        <PageHeader
          eyebrow="Warehouse"
          title="Add a robot"
          trail={[{ label: "Dashboard", href: "/" }, { label: "Add robot" }]}
        />
        <Panel>
          <EmptyState
            icon={<ShieldAlert size={26} aria-hidden />}
            title="Adding stock needs the Inventory role"
          >
            Your account can read the catalogue but not change stock. Ask an admin if
            that is wrong.
          </EmptyState>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Warehouse"
        title="Add a robot"
        trail={[{ label: "Dashboard", href: "/" }, { label: "Add robot" }]}
      />
      <RobotStockForm redirectTo="/robots" />
    </>
  );
}
