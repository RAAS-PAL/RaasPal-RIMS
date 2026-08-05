import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import "./globals.css";

/* Chakra Petch is cut by a Thai foundry and carries the same chamfered,
   flat-cornered geometry as the RaasPal mark. It is the display voice only —
   page titles and panel headings — and never runs body copy. */
const display = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const sans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* Every quantity, price, SKU and timestamp is set in mono so figures line up
   down a column and a mistyped digit is visible. */
const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RaasPal · Robot Inventory Management System",
    template: "%s · RaasPal RIMS",
  },
  description:
    "Internal inventory and specification record for the RaasPal robot fleet.",
  icons: { icon: "/brand/raaspal-mark.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#070d14" },
  ],
};

/* Runs before first paint so the stored theme never flashes the wrong way. */
const themeBootstrap = `(function(){try{var s=localStorage.getItem("rims-theme")||"system";var d=s==="dark"||(s==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full bg-app text-fg">{children}</body>
    </html>
  );
}
