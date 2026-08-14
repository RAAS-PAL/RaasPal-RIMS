/**
 * Turns a photo chosen from the device into a base64 data URI small enough to
 * store on a robot_units row.
 *
 * Adapted from the console's lib/signature-image.ts, which solves the same problem
 * for CM report signatures. Two things differ, both because this is a photograph
 * rather than a line drawing:
 *
 *   - JPEG, not PNG. A 1200px photo encoded as PNG runs to several megabytes;
 *     the same image as JPEG is a couple of hundred kilobytes with no visible
 *     loss at this size. PNG is the right choice for a signature and the wrong
 *     one for a camera shot.
 *
 *   - Quality steps down instead of failing. A signature that will not fit is a
 *     bad crop and worth rejecting; a robot photo that will not fit just needs
 *     more compression, and telling a warehouse operator "that photo is too big"
 *     when the software could simply shrink it is not an answer.
 *
 * The backend re-checks the result. This is convenience; the server is the boundary.
 */

/** Long edge. Enough to identify a machine and read a label on the chassis. */
const MAX_EDGE_PX = 1200;

/** Matches the server ceiling in RobotUnitService.MAX_IMAGE_BYTES. */
export const MAX_IMAGE_BYTES = 1024 * 1024;

/** Tried in order until one fits the budget. */
const QUALITY_STEPS = [0.82, 0.7, 0.6, 0.5, 0.4];

export async function fileToRobotImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG or HEIC).");
  }

  const bitmap = await loadBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process the image in this browser.");

    // JPEG has no alpha channel; without a white ground, a transparent PNG would
    // encode its transparent regions as black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_IMAGE_BYTES) return dataUrl;
    }

    // Every quality step still too large — the image must be enormous. Halve the
    // dimensions once and try again at the lowest quality before giving up.
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.round(width / 2));
    small.height = Math.max(1, Math.round(height / 2));
    const smallCtx = small.getContext("2d");
    if (smallCtx) {
      smallCtx.fillStyle = "#ffffff";
      smallCtx.fillRect(0, 0, small.width, small.height);
      smallCtx.drawImage(canvas, 0, 0, small.width, small.height);
      const dataUrl = small.toDataURL("image/jpeg", 0.5);
      if (dataUrl.length <= MAX_IMAGE_BYTES) return dataUrl;
    }

    throw new Error("That photo is unusually large. Try taking it again at a lower resolution.");
  } finally {
    // createImageBitmap allocates outside the JS heap. Release it rather than
    // waiting for GC — an operator may add photos for a whole delivery in a row.
    bitmap.close?.();
  }
}

/**
 * `createImageBitmap` is the fast path and applies EXIF orientation, so a photo
 * taken sideways on a phone is stored the right way up. Older Safari lacks it for
 * File inputs, hence the <img> fallback.
 */
async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That image could not be read. Try a different photo."));
      el.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}
