import { expect, type Page } from "@playwright/test";

/**
 * The e2e build uses the mock backend (src/lib/mock-api.ts): "admin" is an
 * admin, any other username an employee, and any password is accepted.
 *
 * Its data lives in the page's memory, so a full page load resets it. Tests
 * that change data therefore move around by clicking links (client-side
 * navigation) rather than with page.goto().
 */
export async function logIn(page: Page, username: "admin" | "mate") {
  if (!page.url().includes("/login")) {
    await page.goto("/login");
  }

  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(
    page.getByRole("link", { name: new RegExp(`^${username} \\(`) }),
  ).toBeVisible();
}

export async function logOut(page: Page) {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login/);
}

export function nav(page: Page) {
  return page.getByRole("banner").getByRole("navigation");
}

/** Waits until the service worker is installed and controls the page. */
export async function waitForServiceWorker(page: Page) {
  await page.waitForFunction(
    async () => {
      const registration = await navigator.serviceWorker.ready;
      return !!registration.active && !!navigator.serviceWorker.controller;
    },
    undefined,
    { timeout: 15_000 },
  );
}
