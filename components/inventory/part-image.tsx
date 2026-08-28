import { Package } from "lucide-react";

import { imageUrl } from "@/lib/image-url";
import { cx } from "@/lib/format";

/**
 * A part's photograph, or a stand-in when there is none.
 *
 * <p>`src` points at `/api/image/part/{id}` rather than carrying the bytes: the
 * warehouse holds roughly 320 parts, and inlining photos into the list the way robot
 * photos are inlined today would make the inventory page a multi-megabyte download.
 * Lazy so a long table only fetches what is scrolled into view.
 */
export function PartImage({
  id,
  name,
  hasImage,
  updatedAt,
  className,
}: {
  id: string;
  name: string;
  hasImage: boolean;
  /** Cache-busts the photo URL; see {@link imageUrl}. */
  updatedAt?: string | null;
  className?: string;
}) {
  const src = imageUrl("part", id, hasImage, updatedAt);
  return (
    <div
      className={cx(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-subtle",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by our own route handler
        <img
          src={src}
          alt={`${name} photograph`}
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
        />
      ) : (
        <Package size={16} aria-hidden className="text-faint" />
      )}
    </div>
  );
}
