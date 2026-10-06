import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // Browser-like globals (window, localStorage, ...) for every test.
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    env: {
      // A fixed timezone with daylight saving time, so date logic is tested
      // the same way on every machine, including DST edge cases.
      TZ: "Europe/Budapest",
      // Tests always exercise the real API client, never the mock backend.
      NEXT_PUBLIC_USE_MOCK: "false",
      NEXT_PUBLIC_API_BASE_URL: "http://api.test",
    },
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/lib/mock-*.ts"],
    },
  },
});
