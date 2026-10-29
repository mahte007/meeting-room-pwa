import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import EditReservationPage from "./page";
import {
  adminUser,
  employees,
  employeeUser,
  makeReservation,
  rooms,
} from "@/test/fixtures";
import { setNavigation } from "@/test/navigation";
import { renderWithProviders, signIn } from "@/test/render";
import { apiUrl, server } from "@/test/server";
import type { Reservation } from "@/lib/types";

function openEditPage(reservation: Reservation) {
  setNavigation({
    pathname: `/reservations/${reservation.id}/edit`,
    params: { id: String(reservation.id) },
  });
  server.use(
    http.get(apiUrl("/api/reservations/:id"), () => HttpResponse.json(reservation)),
    http.get(apiUrl("/api/rooms/active"), () => HttpResponse.json(rooms)),
    http.get(apiUrl("/api/employees/active"), () => HttpResponse.json(employees)),
  );

  return renderWithProviders(<EditReservationPage />);
}

describe("EditReservationPage", () => {
  it("opens the form for the employee's own reservation", async () => {
    signIn(employeeUser);
    openEditPage(makeReservation({ title: "Mine", employeeId: 1 }));

    expect(await screen.findByLabelText("Title")).toHaveValue("Mine");
  });

  it.each([
    [
      "someone else's reservation",
      { employeeId: 2 },
      "You can only modify your own reservations.",
    ],
    ["an archived reservation", { archived: true }, "Archived reservations cannot be modified."],
    [
      "a cancelled reservation",
      { status: "CANCELLED" as const },
      "Cancelled or completed reservations cannot be modified.",
    ],
  ])("explains why an employee can't edit %s", async (_, overrides, reason) => {
    signIn(employeeUser);
    openEditPage(makeReservation({ employeeId: 1, ...overrides }));

    expect(await screen.findByText(reason)).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).toBeNull();
  });

  it("lets an admin edit anyone's reservation, with an employee picker", async () => {
    signIn(adminUser);
    openEditPage(makeReservation({ title: "Anna's", employeeId: 2 }));

    expect(await screen.findByLabelText("Title")).toHaveValue("Anna's");
    expect(screen.getByLabelText("Employee")).toHaveValue("2");
  });

  it("rejects an invalid id without calling the backend", () => {
    signIn(employeeUser);
    setNavigation({ pathname: "/reservations/abc/edit", params: { id: "abc" } });
    server.use(http.get(apiUrl("/api/rooms/active"), () => HttpResponse.json(rooms)));

    renderWithProviders(<EditReservationPage />);

    expect(screen.getByText("The reservation id is invalid.")).toBeInTheDocument();
  });
});
