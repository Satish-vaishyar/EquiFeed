import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/api-client-react", "@workspace/db"],
  webpack(config, { dev }) {
    if (dev) {
      config.cache = false;
    }

    return config;
  },
};

export default nextConfig;
