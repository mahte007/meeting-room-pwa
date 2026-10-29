import { expect, test } from "@playwright/test";
import { logIn, nav, waitForServiceWorker } from "./helpers";

test.describe("offline", () => {
  test("a page opened online still works after going offline and reloading", async ({
    page,
    context,
  }) => {
    await logIn(page, "mate");
    await waitForServiceWorker(page);

    // Reached by clicking, as a user would, not by a full page load.
    await nav(page).getByRole("link", { name: "Reservations" }).click();
    await expect(page.getByRole("heading", { name: "Team Sync" })).toBeVisible();

    await context.setOffline(true);
    await page.reload();

    // The page comes from the service worker, the data from IndexedDB.
    await expect(page.getByRole("heading", { name: "Reservations", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Team Sync" })).toBeVisible();
    await expect(page.getByText(/You are offline\. Showing data from/)).toBeVisible();
  });

  test("other app pages also open offline", async ({ page, context }) => {
    await logIn(page, "mate");
    await waitForServiceWorker(page);
    // Load the reservations data once, so the calendar has something to show.
    await nav(page).getByRole("link", { name: "Reservations" }).click();
    await expect(page.getByRole("heading", { name: "Team Sync" })).toBeVisible();

    await context.setOffline(true);
    await nav(page).getByRole("link", { name: "Calendar" }).click();

    await expect(page.getByRole("heading", { name: "Calendar", level: 1 })).toBeVisible();
  });

  test("pages never visited open offline from the precache", async ({
    page,
    context,
  }) => {
    await logIn(page, "mate");
    await waitForServiceWorker(page);

    await context.setOffline(true);
    // A full page load of a page this session never opened.
    await page.goto("/rooms/available");

    await expect(page.getByRole("heading", { name: "Find a free room" })).toBeVisible();
  });

  test("pages with an id in the URL fall back to the offline page", async ({
    page,
    context,
  }) => {
    await logIn(page, "mate");
    await waitForServiceWorker(page);

    await context.setOffline(true);
    await page.goto("/rooms/1");

    await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
  });

  test("changes are disabled while offline", async ({ page, context }) => {
    await logIn(page, "mate");
    await nav(page).getByRole("link", { name: "Reservations" }).click();
    await expect(page.getByRole("heading", { name: "Team Sync" })).toBeVisible();

    await context.setOffline(true);

    await expect(page.getByText(/You are offline\./).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "New reservation" })).toBeDisabled();
  });

  test("data that was never loaded says so instead of looking empty", async ({
    page,
    context,
  }) => {
    await logIn(page, "admin");
    await nav(page).getByRole("link", { name: "Reservations" }).click();
    await expect(page.getByRole("heading", { name: "Team Sync" })).toBeVisible();

    await context.setOffline(true);
    await page.getByRole("link", { name: "Archived" }).click();

    await expect(page.getByText(/hasn't been loaded on this device yet/)).toBeVisible();
  });
});
