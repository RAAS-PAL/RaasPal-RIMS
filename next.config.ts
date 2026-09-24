import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Part photos travel through server actions. They are resized in the browser to at
      // most ~1 MB, which with the other form fields can pass the 1 MB default.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
