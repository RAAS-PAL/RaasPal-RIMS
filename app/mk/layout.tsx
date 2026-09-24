import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "MK spare parts", template: "%s · MK spare parts" },
  // A private page reached by a shared link - keep it out of search engines.
  robots: { index: false, follow: false },
};

/**
 * MK staff's read-only pages. Deliberately outside RIMS's signed-in layout: no RIMS menu,
 * no RAAS PAL session - only the PIN session in its own /mk cookie.
 */
export default function MkLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-app">{children}</div>;
}
