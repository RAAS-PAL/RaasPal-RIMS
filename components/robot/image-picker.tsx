"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp, Loader2, X } from "lucide-react";

import { fileToRobotImageDataUrl } from "@/lib/robot-image";

/**
 * Choose a robot photo from the device — file browser, drag and drop, or the
 * phone camera.
 *
 * <p>The image is downscaled and JPEG-encoded in the browser before it goes
 * anywhere, so what leaves the device is a couple of hundred kilobytes rather than
 * a 5 MB camera original. It is carried in a hidden input as a base64 data URI, so
 * the surrounding <form> can post it with everything else and the component needs
 * no state wiring from its parent.
 *
 * <p>Three states, and the difference between them is load-bearing:
 *
 * <ul>
 *   <li><b>untouched</b> — the hidden input is not rendered at all, so the field never
 *       reaches the server and the stored photo is left exactly as it was.</li>
 *   <li><b>removed</b> — the input carries "", which tells the server to clear it.</li>
 *   <li><b>chosen</b> — the input carries a base64 data URI.</li>
 * </ul>
 *
 * <p>The untouched case is why this tracks the <em>choice</em> rather than the current
 * photo. `initialValue` is a URL pointing at the image endpoint, not the image itself;
 * seeding state with it and posting it back made every edit fail validation on the
 * server with "Image must be an http(s) URL or a base64 data:image/... URI" — while
 * the operator was changing something else entirely.
 */
export function RobotImagePicker({
  name = "imageUrl",
  initialValue = null,
  disabled = false,
}: {
  name?: string;
  /**
   * Where the existing photo can be seen when editing; null when adding. Shown, never
   * submitted — it is a URL for the image endpoint, not the image.
   */
  initialValue?: string | null;
  disabled?: boolean;
}) {
  /** null until the user picks or removes something. See the note above. */
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  async function accept(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setChoice(await fileToRobotImageDataUrl(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That image could not be read.");
    } finally {
      setBusy(false);
    }
  }

  /** The stored photo until the user does something; "" once they remove it. */
  const preview = choice === null ? initialValue : choice || null;

  return (
    <div className="space-y-2">
      {/* Genuinely absent while untouched — an empty value here would read on the
          server as "clear the photo", which is a different instruction. */}
      {choice === null ? null : <input type="hidden" name={name} value={choice} />}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void accept(e.target.files?.[0])}
      />
      {/* `capture` opens the rear camera directly on a phone, and is ignored on
          desktop, where this input behaves like the one above. */}
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void accept(e.target.files?.[0])}
      />

      {preview ? (
        <div className="relative w-fit overflow-hidden rounded-lg border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data: URI cannot go through next/image */}
          <img src={preview} alt="Robot" className="h-40 w-auto object-contain" />
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                setChoice("");
                if (fileInput.current) fileInput.current.value = "";
              }}
              className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-white hover:bg-black/80"
              aria-label="Remove photo"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void accept(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition ${
            dragging ? "border-brand bg-brand-wash" : "border-line"
          }`}
        >
          {busy ? (
            <>
              <Loader2 size={20} className="animate-spin text-muted" aria-hidden />
              <p className="text-xs text-muted">Processing…</p>
            </>
          ) : (
            <>
              <ImageUp size={20} className="text-muted" aria-hidden />
              <p className="text-xs text-muted">Drag a photo here, or</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => fileInput.current?.click()}
                  className="rounded-md border border-line px-2.5 py-1 text-xs font-medium hover:border-brand"
                >
                  Choose file
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => cameraInput.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs font-medium hover:border-brand"
                >
                  <Camera size={13} aria-hidden />
                  Take photo
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-crit-ink">{error}</p>}
    </div>
  );
}
