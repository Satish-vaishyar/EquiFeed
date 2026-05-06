import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/db"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingExcludes: {
    "/*": [
      "../../.git_backup_inner/**/*",
      "../../scratch/**/*",
      "../../.local/**/*",
      "../../scoring-engine/**/*",
      "../../**/*.log",
    ],
  },
};

export default nextConfig;
