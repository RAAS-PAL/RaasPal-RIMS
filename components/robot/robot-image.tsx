import type { BackendRobotType } from "@/lib/backend-types";
import { ROBOT_TYPE_LABELS } from "@/lib/backend-types";
import { cx } from "@/lib/format";

/**
 * Line-art stand-ins, one per robot type. A missing photograph should still read
 * as a robot of the right kind rather than a broken frame, and the drawing tells
 * you what class of machine the record is about.
 *
 * <p>One per value of the backend enum — a type with no drawing would render an
 * empty frame, so this map has to grow whenever that enum does.
 */
const GLYPHS: Record<BackendRobotType, React.ReactNode> = {
  CLEANING: (
    <>
      <path d="M12 30h24l-3-12a4 4 0 0 0-3.9-3h-10.2a4 4 0 0 0-3.9 3Z" />
      <circle cx="17" cy="35" r="4" />
      <circle cx="31" cy="35" r="4" />
      <path d="M22 15h4" />
      <path d="M14 30h20" />
    </>
  ),
  /* Push-along rather than self-driving: a handle and no drive wheels is what
     separates equipment from the robot above it at a glance. */
  CLEANING_EQUIPMENT: (
    <>
      <path d="M14 34h20a2 2 0 0 0 2-2v-6a4 4 0 0 0-4-4H16a4 4 0 0 0-4 4v6a2 2 0 0 0 2 2Z" />
      <path d="M16 22V13a3 3 0 0 1 3-3h9" />
      <path d="M26 8h6a2 2 0 0 1 0 4h-6a2 2 0 0 1 0-4Z" />
      <path d="M12 38h24" />
      <path d="M19 27h10" />
    </>
  ),
  DELIVERY: (
    <>
      <rect x="14" y="9" width="20" height="4" rx="1.5" />
      <rect x="14" y="19" width="20" height="4" rx="1.5" />
      <rect x="14" y="29" width="20" height="4" rx="1.5" />
      <path d="M18 13v6M30 13v6M18 23v6M30 23v6" />
      <path d="M17 33v3M31 33v3" />
      <circle cx="17" cy="38" r="2" />
      <circle cx="31" cy="38" r="2" />
    </>
  ),
  MOWING: (
    <>
      <path d="M12 30h24a2 2 0 0 0 2-2v-5a4 4 0 0 0-4-4H14a4 4 0 0 0-4 4v5a2 2 0 0 0 2 2Z" />
      <circle cx="16" cy="34" r="4" />
      <circle cx="32" cy="34" r="4" />
      <path d="M18 19v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" />
      <path d="M9 41c2-3 4-3 6 0M19 41c2-3 4-3 6 0M29 41c2-3 4-3 6 0" />
    </>
  ),
  SECURITY: (
    <>
      <rect x="17" y="14" width="14" height="24" rx="3" />
      <circle cx="24" cy="10" r="4" />
      <path d="M21 22h6M21 28h6" />
      <path d="M33 8a8 8 0 0 1 0 8M37 5a13 13 0 0 1 0 14" />
    </>
  ),
  COOKING: (
    <>
      <path d="M11 22h26a13 13 0 0 1-26 0Z" />
      <path d="M37 22h5" />
      <path d="M18 36h12" />
      <path d="M24 36v-2" />
      <path d="M19 15c0-3 2-3 2-6M27 15c0-3 2-3 2-6" />
    </>
  ),
  RECEPTION: (
    <>
      <rect x="15" y="8" width="18" height="14" rx="3" />
      <path d="M21 14h.02M27 14h.02" />
      <path d="M24 22v6" />
      <path d="M16 40c0-5 3.6-8 8-8s8 3 8 8Z" />
      <path d="M18 28h12" />
    </>
  ),
};

export function RobotTypeGlyph({
  robotType,
  className,
}: {
  robotType: BackendRobotType;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {GLYPHS[robotType]}
    </svg>
  );
}

/**
 * A robot's photograph, or a stand-in when there is none.
 *
 * <p>A plain `<img>` rather than `next/image`: photos are stored as base64 `data:`
 * URIs on the row itself — the same choice the CM report signatures made, because
 * Render's disk is ephemeral — and the image optimiser cannot fetch or resize those.
 */
export function RobotImage({
  name,
  robotType,
  src,
  size = "card",
  className,
}: {
  name: string;
  robotType: BackendRobotType;
  src: string | null;
  /** `card` for the grid, `row` for a table cell. */
  size?: "card" | "row";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative flex items-center justify-center overflow-hidden bg-subtle",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data: URI cannot go through next/image
        <img
          src={src}
          alt={`${name} photograph`}
          className="size-full object-contain"
        />
      ) : (
        <>
          {/* Faint measuring grid — a stand-in reads as a technical placeholder,
              not as a failed image. */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage:
                "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <RobotTypeGlyph
            robotType={robotType}
            className={cx("relative text-faint", size === "row" ? "size-8" : "size-16")}
          />
          {size !== "row" ? (
            <p className="eyebrow absolute bottom-2 left-0 right-0 text-center">
              No photo · {ROBOT_TYPE_LABELS[robotType]}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
