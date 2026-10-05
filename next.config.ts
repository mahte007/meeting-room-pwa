import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * Identifies this build, e.g. "4f42cc8-mfz3k2a1". It is stamped into the
 * service worker, so every build installs a new worker with fresh caches.
 */
function getBuildId() {
  const timestamp = Date.now().toString(36);

  try {
    const commit = execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    return `${commit}-${timestamp}`;
  } catch {
    return timestamp;
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: getBuildId(),
  },
};

export default nextConfig;
