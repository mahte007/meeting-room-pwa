import { expect, test, type Page } from "@playwright/test";
import { logIn, logOut, nav } from "./helpers";

function reservationCard(page: Page, title: string) {
  return page.getByRole("article").filter({
    has: page.getByRole("heading", { name: title }),
  });
}

test("an employee books a room and an admin approves it", async ({ page }) => {
  const title = `E2E planning ${Date.now()}`;

  // The employee books a room.
  await logIn(page, "mate");
  await nav(page).getByRole("link", { name: "Reservations" }).click();
  await page.getByRole("link", { name: "New reservation" }).click();

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Attendee count").fill("4");
  await page.getByLabel("Room").selectOption({ label: "Conference A — 1st Floor — capacity 10" });
  await page.getByRole("button", { name: "Create reservation" }).click();

  await expect(page.getByText("Reservation created successfully.")).toBeVisible();
  await expect(reservationCard(page, title)).toContainText("PLANNED");

  await page.getByRole("link", { name: "My reservations" }).click();
  await expect(reservationCard(page, title)).toBeVisible();

  // An admin approves it from the approval queue.
  await logOut(page);
  await logIn(page, "admin");
  await nav(page).getByRole("link", { name: "Reservations" }).click();
  await page.getByRole("link", { name: "Awaiting approval" }).click();

  await reservationCard(page, title).getByRole("button", { name: "Approve" }).click();

  await expect(page.getByText("Reservation status changed to APPROVED.")).toBeVisible();
  await expect(reservationCard(page, title)).toHaveCount(0);

  await page.getByRole("link", { name: "All", exact: true }).click();
  await expect(reservationCard(page, title)).toContainText("APPROVED");
});

test("the form refuses invalid input before contacting the server", async ({
  page,
}) => {
  await logIn(page, "mate");
  await nav(page).getByRole("link", { name: "Reservations" }).click();
  await page.getByRole("link", { name: "New reservation" }).click();

  await page.getByLabel("Attendee count").fill("50");
  await page.getByLabel("Room").selectOption({ label: "Conference B — 2nd Floor — capacity 6" });
  await page.getByRole("button", { name: "Create reservation" }).click();

  await expect(page.getByText("Title is required.")).toBeVisible();
  await expect(page.getByText("This room only supports 6 attendees.")).toBeVisible();
  await expect(page).toHaveURL("/reservations/new");
});

test("a free room found by search opens a prefilled booking form", async ({
  page,
}) => {
  await logIn(page, "mate");
  await nav(page).getByRole("link", { name: "Find a room" }).click();

  await page.getByLabel("Attendees").fill("8");
  await page.getByRole("button", { name: "Search" }).click();

  // Conference B (6 seats) is filtered out; Conference A (10) fits.
  const result = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Conference A" }),
  });
  await expect(result).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conference B" })).toHaveCount(0);

  await result.getByRole("link", { name: "Book" }).click();

  await expect(page.getByLabel("Room")).toHaveValue("1");
  await expect(page.getByLabel("Attendee count")).toHaveValue("8");
});
