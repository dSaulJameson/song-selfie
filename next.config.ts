import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["node_modules/ffmpeg-static/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
