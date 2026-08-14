/*
 * Sets data-theme on <html> before the browser paints, so a stored dark preference
 * never flashes light first.
 *
 * It lives here as a file rather than inline in the layout because Next only
 * supports `strategy="beforeInteractive"` with `src` — an inline script with that
 * strategy falls back to a plain <script> element in the React tree, which React 19
 * warns about and never executes on the client.
 *
 * Keep "rims-theme" in step with STORAGE_KEY in components/shell/theme-toggle.tsx.
 * They are two halves of one contract and nothing enforces it.
 */
(function () {
  try {
    var stored = localStorage.getItem("rims-theme") || "system";
    var dark =
      stored === "dark" ||
      (stored === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  } catch (e) {
    // Private browsing can throw on localStorage. Light is the safe default: the
    // page still renders, it just may correct itself once the toggle mounts.
    document.documentElement.dataset.theme = "light";
  }
})();
