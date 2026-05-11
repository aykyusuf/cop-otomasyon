import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  ...(process.env.NODE_ENV === "production" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
