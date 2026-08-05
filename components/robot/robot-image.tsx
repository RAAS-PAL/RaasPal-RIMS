import Image from "next/image";

import { CATEGORY_META } from "@/lib/catalog";
import { cx } from "@/lib/format";
import type { CategoryId } from "@/lib/types";

/**
 * Line-art stand-ins, one per category. A missing photograph should still
 * read as a robot of the right kind rather than a broken frame, and the
 * drawing tells you what class of machine the record is about.
 * Drop `<slug>.webp` into public/robots/ and the photo takes over.
 */
const GLYPHS: Record<CategoryId, React.ReactNode> = {
  cleaning: (
    <>
      <path d="M12 30h24l-3-12a4 4 0 0 0-3.9-3h-10.2a4 4 0 0 0-3.9 3Z" />
      <circle cx="17" cy="35" r="4" />
      <circle cx="31" cy="35" r="4" />
      <path d="M22 15h4" />
      <path d="M14 30h20" />
    </>
  ),
  delivery: (
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
  reception: (
    <>
      <rect x="15" y="8" width="18" height="14" rx="3" />
      <path d="M21 14h.02M27 14h.02" />
      <path d="M24 22v6" />
      <path d="M16 40c0-5 3.6-8 8-8s8 3 8 8Z" />
      <path d="M18 28h12" />
    </>
  ),
  patrol: (
    <>
      <rect x="17" y="14" width="14" height="24" rx="3" />
      <circle cx="24" cy="10" r="4" />
      <path d="M24 14v0" />
      <path d="M21 22h6M21 28h6" />
      <path d="M33 8a8 8 0 0 1 0 8M37 5a13 13 0 0 1 0 14" />
    </>
  ),
  cooking: (
    <>
      <path d="M11 22h26a13 13 0 0 1-26 0Z" />
      <path d="M37 22h5" />
      <path d="M18 36h12" />
      <path d="M24 36v-2" />
      <path d="M19 15c0-3 2-3 2-6M27 15c0-3 2-3 2-6" />
    </>
  ),
  "canal-cleaning": (
    <>
      <path d="M9 24h30l-4 8H13Z" />
      <rect x="19" y="14" width="10" height="10" rx="2" />
      <path d="M24 10v4" />
      <path d="M7 37c3 0 3 2 6.5 2s3.5-2 7-2 3.5 2 7 2 3.5-2 6.5-2" />
    </>
  ),
  spider: (
    <>
      <rect x="16" y="16" width="16" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="36" cy="12" r="3" />
      <circle cx="12" cy="36" r="3" />
      <circle cx="36" cy="36" r="3" />
      <path d="M14.5 14.5 16 16M33.5 14.5 32 16M14.5 33.5 16 32M33.5 33.5 32 32" />
      <circle cx="24" cy="24" r="3" />
    </>
  ),
};

export function CategoryGlyph({
  category,
  className,
}: {
  category: CategoryId;
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
      {GLYPHS[category]}
    </svg>
  );
}

export function RobotImage({
  name,
  category,
  src,
  size = "card",
  className,
}: {
  name: string;
  category: CategoryId;
  src: string | null;
  /** `card` for the catalogue grid, `hero` for the detail page. */
  size?: "card" | "hero" | "row";
  className?: string;
}) {
  const dimensions =
    size === "hero"
      ? { width: 760, height: 570, sizes: "(max-width: 1024px) 100vw, 44rem" }
      : size === "row"
        ? { width: 96, height: 72, sizes: "72px" }
        : { width: 420, height: 315, sizes: "(max-width: 768px) 50vw, 20rem" };

  return (
    <div
      className={cx(
        "relative flex items-center justify-center overflow-hidden bg-subtle",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`${name} product photograph`}
          width={dimensions.width}
          height={dimensions.height}
          sizes={dimensions.sizes}
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
          <CategoryGlyph
            category={category}
            className={cx(
              "relative text-faint",
              size === "hero" ? "size-32" : size === "row" ? "size-8" : "size-16",
            )}
          />
          {size !== "row" ? (
            <p className="eyebrow absolute bottom-2 left-0 right-0 text-center">
              No photo · {CATEGORY_META[category].label}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
