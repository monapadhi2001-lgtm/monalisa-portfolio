import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // three.js ships modern ESM; transpiling keeps older browsers happy.
  transpilePackages: ["three"],
};

export default nextConfig;
