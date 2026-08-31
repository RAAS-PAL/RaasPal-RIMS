import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  FlaskConical,
  PackageOpen,
  Undo2,
  Wrench,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cx, num } from "@/lib/format";
import { ROLE_LABEL, sortRoles } from "@/lib/rbac";
import {
  PACKAGING_LABELS,
  STATUS_LABELS,
  type Packaging,
  type StockRoomStatus,
} from "@/lib/backend-types";
import type { Role, StockState } from "@/lib/types";

export type Tone = "neutral" | "brand" | "ok" | "warn" | "crit" | "demo";

const TONES: Record<Tone, string> = {
  neutral: "border-line-strong bg-inset text-muted",
  brand: "border-[var(--brand-600)]/35 bg-brand-wash text-[var(--brand-ink)]",
  ok: "border-[var(--ok-dot)]/35 bg-ok-wash text-ok-ink",
  warn: "border-[var(--warn-dot)]/35 bg-warn-wash text-warn-ink",
  crit: "border-[var(--crit-dot)]/35 bg-crit-wash text-crit-ink",
  demo: "border-[var(--demo-dot)]/35 bg-demo-wash text-demo-ink",
};

export function Chip({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "text-[0.6875rem] font-medium leading-5 whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

const STOCK_PRESENTATION: Record<
  StockState,
  { tone: Tone; label: string; icon: ReactNode }
> = {
  "in-stock": {
    tone: "ok",
    label: "In stock",
    icon: <CheckCircle2 size={13} aria-hidden />,
  },
  "low-stock": {
    tone: "warn",
    label: "Low stock",
    icon: <AlertTriangle size={13} aria-hidden />,
  },
  "out-of-stock": {
    tone: "crit",
    label: "Out of stock",
    icon: <CircleSlash size={13} aria-hidden />,
  },
};

/** Status carries an icon and a word as well as a colour, so it survives a
 *  monochrome print-out and colour-blind readers. */
export function StockBadge({
  state,
  count,
}: {
  state: StockState;
  /** On-hand units, appended when there are any. */
  count?: number;
}) {
  const { tone, label, icon } = STOCK_PRESENTATION[state];
  return (
    <Chip tone={tone}>
      {icon}
      {label}
      {typeof count === "number" && count > 0 ? (
        <span className="tnum font-mono font-semibold">{num(count)}</span>
      ) : null}
    </Chip>
  );
}

export function DemoChip({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Chip tone="demo">
      <FlaskConical size={13} aria-hidden />
      Demo
      <span className="tnum font-mono font-semibold">{num(count)}</span>
    </Chip>
  );
}

const STATUS_PRESENTATION: Record<StockRoomStatus, { tone: Tone; icon: ReactNode }> = {
  IN_STOCK: { tone: "ok", icon: <CheckCircle2 size={13} aria-hidden /> },
  DEMO: { tone: "demo", icon: <FlaskConical size={13} aria-hidden /> },
  UNDER_REPAIR: { tone: "warn", icon: <Wrench size={13} aria-hidden /> },
  RETURNED_FROM_CUSTOMER: { tone: "neutral", icon: <Undo2 size={13} aria-hidden /> },
};

/**
 * Where a shelf stands, as a word and an icon rather than a colour alone.
 *
 * <p>Under Repair is warn and Returned neutral, not because either is an error, but
 * because neither is sellable — a warehouse scanning for what it can promise a
 * customer should not find them sitting in the same green as stock.
 */
export function StatusChip({
  status,
  count,
}: {
  status: StockRoomStatus;
  count?: number;
}) {
  const { tone, icon } = STATUS_PRESENTATION[status];
  return (
    <Chip tone={tone}>
      {icon}
      {STATUS_LABELS[status]}
      {typeof count === "number" && count > 0 ? (
        <span className="tnum font-mono font-semibold">{num(count)}</span>
      ) : null}
    </Chip>
  );
}

/**
 * How many units are on this shelf, and whether they are boxed — "2 Box".
 *
 * <p>The number is the whole row, not a share of it. The column stores one word for
 * the shelf, so either every unit on the row is boxed or none is. A shelf holding
 * one boxed and two unboxed cannot be recorded at all, and no rendering of this
 * column can invent the split.
 *
 * <p>Renders nothing when nobody has recorded it, which is not the same as zero.
 */
export function PackagingChip({
  quantity,
  packaging,
}: {
  quantity: number;
  packaging: Packaging | null;
}) {
  if (!packaging || quantity <= 0) return null;

  return (
    <Chip tone="neutral">
      <PackageOpen size={13} aria-hidden />
      <span className="tnum font-mono font-semibold">{num(quantity)}</span>
      {PACKAGING_LABELS[packaging]}
    </Chip>
  );
}

export function RoleBadges({ roles }: { roles: Role[] }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {sortRoles(roles).map((role) => (
        <Chip key={role} tone={role === "admin" ? "brand" : "neutral"}>
          {ROLE_LABEL[role]}
        </Chip>
      ))}
    </span>
  );
}
