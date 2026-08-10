import Image from "next/image";

import { cx } from "@/lib/format";

/**
 * The official RaasPal marks, wrapped so they cannot be distorted.
 *
 * A bare <Image> dropped into a `flex flex-col` container is a flex item with
 * an `auto` cross-size, so `align-items: stretch` pulls it to the full column
 * width while the height class holds — which squashes a 4:1 wordmark to
 * something like 20:1. The `w-fit` wrapper gives the item a non-auto
 * cross-size, so stretch never applies and the image keeps its intrinsic
 * ratio in any layout.
 *
 * Set the size with a height class (`h-7`, `h-14`); width follows.
 */

export function Wordmark({
  className,
  alt = "RaasPal",
  priority,
}: {
  /** Height class, e.g. `h-14`. Width is derived from the 4:1 ratio. */
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <span className="block w-fit shrink-0 leading-none">
      <Image
        src="/brand/raaspal-wordmark.png"
        alt={alt}
        width={2000}
        height={500}
        priority={priority}
        className={cx("w-auto object-contain", className)}
      />
    </span>
  );
}

export function Mark({
  className,
  alt = "",
  priority,
}: {
  /** Square size class, e.g. `size-9`. */
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <span className="block w-fit shrink-0 leading-none">
      <Image
        src="/brand/raaspal-mark.png"
        alt={alt}
        width={256}
        height={256}
        priority={priority}
        className={cx("object-contain", className)}
      />
    </span>
  );
}
