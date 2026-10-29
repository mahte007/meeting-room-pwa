import { expect, test } from "@playwright/test";
import { logIn, logOut, nav } from "./helpers";

test("sends visitors to the login page and back to where they were going", async ({
  page,
}) => {
  await page.goto("/calendar");

  await expect(page).toHaveURL("/login?redirect=%2Fcalendar");

  await logIn(page, "mate");

  await expect(page).toHaveURL("/calendar");
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
});

test("shows employees only the pages they can use", async ({ page }) => {
  await logIn(page, "mate");

  await expect(nav(page).getByRole("link")).toHaveText([
    "Dashboard",
    "Rooms",
    "Find a room",
    "Reservations",
    "Calendar",
  ]);
});

test("gives admins the management pages", async ({ page }) => {
  await logIn(page, "admin");

  await expect(nav(page).getByRole("link", { name: "Employees" })).toBeVisible();
  await expect(nav(page).getByRole("link", { name: "Users" })).toBeVisible();
});

test("keeps employees out of admin pages opened by URL", async ({ page }) => {
  await logIn(page, "mate");

  await page.goto("/users");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Users" })).toHaveCount(0);
});

test("logging out ends the session", async ({ page }) => {
  await logIn(page, "mate");
  await logOut(page);

  await page.goto("/reservations");

  await expect(page).toHaveURL(/\/login\?redirect=/);
});
