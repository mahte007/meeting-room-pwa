import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { ReservationsList } from "./reservations-list";
import { adminUser, employeeUser, makeReservation } from "@/test/fixtures";
import { renderWithProviders, setOnline, signIn } from "@/test/render";
import type { Reservation } from "@/lib/types";

function renderList(
  reservations: Reservation[],
  handlers: Partial<Parameters<typeof ReservationsList>[0]> = {},
) {
  return renderWithProviders(
    <ReservationsList
      reservations={reservations}
      onArchive={vi.fn()}
      onStatusChange={vi.fn()}
      onRestore={vi.fn()}
      {...handlers}
    />,
  );
}

/** The card for a reservation, found by its title. */
function card(title: string) {
  return screen.getByRole("heading", { name: title }).closest("article")!;
}

function buttonNames(title: string) {
  return within(card(title))
    .queryAllByRole("button")
    .map((button) => button.textContent);
}

describe("ReservationsList", () => {
  it("says so when there is nothing to show", () => {
    signIn(employeeUser);
    renderList([], { emptyText: "You have no reservations." });

    expect(screen.getByText("You have no reservations.")).toBeInTheDocument();
  });

  describe("as an employee", () => {
    it("allows editing and archiving only their own reservations", () => {
      signIn(employeeUser);
      renderList([
        makeReservation({ title: "Mine", employeeId: 1 }),
        makeReservation({ title: "Anna's", employeeId: 2, employeeName: "Anna Kovács" }),
      ]);

      expect(within(card("Mine")).getByRole("link", { name: "Edit" })).toBeInTheDocument();
      expect(buttonNames("Mine")).toContain("Archive");

      expect(within(card("Anna's")).queryByRole("link", { name: "Edit" })).toBeNull();
      expect(buttonNames("Anna's")).not.toContain("Archive");
    });

    it("never offers status changes", () => {
      signIn(employeeUser);
      renderList([makeReservation({ title: "Mine", status: "PLANNED" })]);

      expect(buttonNames("Mine")).not.toContain("Approve");
      expect(buttonNames("Mine")).not.toContain("Reject");
    });
  });

  describe("as an admin", () => {
    it.each([
      ["PLANNED", ["Approve", "Reject"]],
      ["APPROVED", ["Cancel", "Mark completed"]],
      ["CANCELLED", []],
      ["COMPLETED", []],
    ] as const)("offers only the allowed transitions from %s", (status, expected) => {
      signIn(adminUser);
      renderList([makeReservation({ title: "Booking", status })]);

      const transitionButtons = buttonNames("Booking").filter(
        (name) => !["Add to calendar", "Archive"].includes(name ?? ""),
      );
      expect(transitionButtons).toEqual(expected);
    });

    it("sends the chosen status", async () => {
      signIn(adminUser);
      const onStatusChange = vi.fn();
      const reservation = makeReservation({ title: "Booking", status: "PLANNED" });
      const { user } = renderList([reservation], { onStatusChange });

      await user.click(within(card("Booking")).getByRole("button", { name: "Approve" }));

      expect(onStatusChange).toHaveBeenCalledWith(reservation.id, "APPROVED");
    });

    it("does not offer editing a cancelled or completed reservation", () => {
      signIn(adminUser);
      renderList([
        makeReservation({ title: "Cancelled", status: "CANCELLED" }),
        makeReservation({ title: "Completed", status: "COMPLETED" }),
      ]);

      expect(within(card("Cancelled")).queryByRole("link", { name: "Edit" })).toBeNull();
      expect(within(card("Completed")).queryByRole("link", { name: "Edit" })).toBeNull();
    });

    it("only offers restoring an archived reservation", () => {
      signIn(adminUser);
      renderList([makeReservation({ title: "Old", archived: true, status: "APPROVED" })]);

      expect(within(card("Old")).getByText("ARCHIVED")).toBeInTheDocument();
      expect(buttonNames("Old")).toEqual(["Restore"]);
    });
  });

  describe("while offline", () => {
    it("disables actions that need the server", () => {
      signIn(adminUser);
      setOnline(false);
      renderList([makeReservation({ title: "Booking", status: "PLANNED" })]);

      expect(screen.getByText("Actions are disabled while offline.")).toBeInTheDocument();
      expect(within(card("Booking")).getByRole("button", { name: "Approve" })).toBeDisabled();
      expect(within(card("Booking")).getByRole("button", { name: "Archive" })).toBeDisabled();
      expect(within(card("Booking")).queryByRole("link", { name: "Edit" })).toBeNull();
    });

    it("still allows exporting to a calendar", () => {
      signIn(employeeUser);
      setOnline(false);
      renderList([makeReservation({ title: "Mine" })]);

      expect(
        within(card("Mine")).getByRole("button", { name: "Add to calendar" }),
      ).toBeEnabled();
    });
  });

  it("does not offer exporting a cancelled reservation", () => {
    signIn(employeeUser);
    renderList([makeReservation({ title: "Off", status: "CANCELLED" })]);

    expect(buttonNames("Off")).not.toContain("Add to calendar");
  });
});
