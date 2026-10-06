import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end tests run against a production build, because the service
 * worker (and so offline support) only exists there. The build uses the
 * mock backend, so no Spring Boot server or database is needed, and goes
 * to .next-e2e so it never replaces the normal .next build.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      // Overrides .env.local: tests always use the mock backend.
      NEXT_PUBLIC_USE_MOCK: "true",
    },
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
