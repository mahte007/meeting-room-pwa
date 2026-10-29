import { expect, test } from "@playwright/test";
import { waitForServiceWorker } from "./helpers";

test("the manifest describes an installable app", async ({ page, request }) => {
  await page.goto("/login");

  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();

  const manifest = await (await request.get(href!)).json();

  expect(manifest).toMatchObject({
    id: "/",
    name: "Meeting Room Reservation",
    start_url: "/",
    display: "standalone",
  });
  expect(manifest.shortcuts.map((s: { url: string }) => s.url)).toEqual([
    "/reservations/new",
    "/calendar",
    "/rooms/available",
  ]);

  // Chrome requires 192px and 512px icons, plus maskable ones for Android.
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.status(), icon.src).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  }
  expect(manifest.icons.map((i: { purpose: string }) => i.purpose)).toContain("maskable");
});

test("the service worker is versioned and lists the pages to precache", async ({
  request,
}) => {
  const response = await request.get("/sw.js");
  const source = await response.text();

  expect(response.headers()["cache-control"]).toContain("no-cache");
  expect(source).not.toContain("__BUILD_ID__");
  expect(source).not.toContain("__APP_PAGES__");
  expect(source).toMatch(/const APP_PAGES = \[.*"\/reservations".*\];/);
});

test("the service worker takes control after the first visit", async ({ page }) => {
  await page.goto("/login");

  await waitForServiceWorker(page);

  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames.some((name) => name.startsWith("pages-"))).toBe(true);
  // API data lives in IndexedDB, never in the service worker's caches.
  expect(cacheNames.some((name) => name.startsWith("api-"))).toBe(false);
});
