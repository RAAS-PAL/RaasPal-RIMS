import { Lock } from "lucide-react";
import type { Metadata } from "next";

import { Mark } from "@/components/brand";
import { MkPinForm } from "@/components/mk/mk-pin-form";

export const metadata: Metadata = { title: "Enter PIN" };

/** MK's front door: a PIN we gave them, exchanged for a 12-hour view-only session. */
export default function MkPinPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-pop)]">
        <div className="mb-6 flex items-center gap-3">
          <Mark className="size-10" priority />
          <div className="leading-tight">
            <p className="text-[1.0625rem] font-semibold">MK spare parts</p>
            <p className="text-[0.75rem] text-muted">Stock held by RAAS PAL</p>
          </div>
        </div>
        <p className="mb-4 flex items-start gap-2 text-[0.8125rem] text-muted">
          <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
          Enter the PIN RAAS PAL gave you. This page is view-only.
        </p>
        <MkPinForm />
      </div>
    </div>
  );
}
