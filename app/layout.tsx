import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Noto_Sans_Thai } from "next/font/google";
import Script from "next/script";

import "./globals.css";

/* Inter runs both display and body, matching the internal operations console so
   the two apps read as one platform.

   This replaces Chakra Petch, which was chosen for a real reason — it is cut by a
   Thai foundry and echoes the chamfered geometry of the RaasPal mark. That link
   to the brand is lost here; it is recoverable by pointing --font-display back at
   it while body copy stays on Inter. */
const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* Inter carries no Thai glyphs. Customer and site names come from the same
   backend as the console, where they are frequently Thai, so this sits behind
   Inter in the stack and the browser resolves per glyph. */
const thai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${sans.variable} ${thai.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-app text-fg">
        {/*
          The theme has to be applied before the browser paints, or a stored dark
          preference flashes light and corrects itself.

          It is a file rather than an inline script because `beforeInteractive` only
          works with `src` — every example in Next's own docs uses one, and an inline
          script with that strategy degrades to a plain <script> element in the React
          tree, which React 19 warns about and never runs on the client.

          The file is a few hundred bytes, same-origin, and preloaded by this
          strategy, so the extra request costs effectively nothing.
        */}
        <Script src="/theme-bootstrap.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
