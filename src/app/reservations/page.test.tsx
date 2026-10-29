import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import ReservationsPage from "./page";
import { adminUser, employeeUser, makeReservation } from "@/test/fixtures";
import { setNavigation } from "@/test/navigation";
import { renderWithProviders, signIn } from "@/test/render";
import { apiError, apiUrl, server } from "@/test/server";
import type { Reservation } from "@/lib/types";

/** A tiny in-memory backend for the reservation endpoints this page uses. */
function backendWith(initial: Reservation[]) {
  let reservations = [...initial];
  const requests: string[] = [];

  server.use(
    http.get(apiUrl("/api/reservations/active"), () =>
      HttpResponse.json(reservations.filter((r) => !r.archived)),
    ),
    http.get(apiUrl("/api/reservations"), () => HttpResponse.json(reservations)),
    http.get(apiUrl("/api/reservations/employee/:id"), ({ params }) =>
      HttpResponse.json(
        reservations.filter(
          (r) => r.employeeId === Number(params.id) && !r.archived,
        ),
      ),
    ),
    http.patch(apiUrl("/api/reservations/:id/status"), async ({ params, request }) => {
      const { status } = (await request.json()) as { status: Reservation["status"] };
      requests.push(`PATCH status ${params.id} ${status}`);
      reservations = reservations.map((r) =>
        r.id === Number(params.id) ? { ...r, status } : r,
      );
      return HttpResponse.json(reservations.find((r) => r.id === Number(params.id)));
    }),
    http.delete(apiUrl("/api/reservations/:id"), ({ params }) => {
      requests.push(`DELETE ${params.id}`);
      reservations = reservations.map((r) =>
        r.id === Number(params.id) ? { ...r, archived: true } : r,
      );
      return new HttpResponse(null, { status: 200 });
    }),
    http.patch(apiUrl("/api/reservations/:id/restore"), ({ params }) => {
      requests.push(`PATCH restore ${params.id}`);
      reservations = reservations.map((r) =>
        r.id === Number(params.id) ? { ...r, archived: false } : r,
      );
      return HttpResponse.json(reservations.find((r) => r.id === Number(params.id)));
    }),
  );

  return { requests };
}

function tabNames() {
  return within(screen.getByRole("navigation", { name: "Reservation views" }))
    .getAllByRole("link")
    .map((link) => link.textContent);
}

function card(title: string) {
  return screen.getByRole("heading", { name: title }).closest("article")!;
}

describe("ReservationsPage", () => {
  it("shows employees the All and My reservations tabs", async () => {
    signIn(employeeUser);
    backendWith([]);

    renderWithProviders(<ReservationsPage />);

    await screen.findByText("No reservations found.");
    expect(tabNames()).toEqual(["All", "My reservations"]);
  });

  it("gives admins the approval queue and archive, but no My tab without an employee", async () => {
    signIn(adminUser);
    backendWith([]);

    renderWithProviders(<ReservationsPage />);

    await screen.findByText("No reservations found.");
    expect(tabNames()).toEqual(["All", "Awaiting approval", "Archived"]);
  });

  it("shows only the employee's own reservations under My reservations", async () => {
    signIn(employeeUser);
    setNavigation({ pathname: "/reservations", search: "view=mine" });
    backendWith([
      makeReservation({ title: "Mine", employeeId: 1 }),
      makeReservation({ title: "Anna's", employeeId: 2 }),
    ]);

    renderWithProviders(<ReservationsPage />);

    expect(await screen.findByRole("heading", { name: "Mine" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Anna's" })).toBeNull();
  });

  it("lets an admin approve a reservation from the approval queue", async () => {
    signIn(adminUser);
    setNavigation({ pathname: "/reservations", search: "view=approval" });
    const planned = makeReservation({ title: "Planning", status: "PLANNED" });
    const { requests } = backendWith([
      planned,
      makeReservation({ title: "Already approved", status: "APPROVED" }),
    ]);

    const { user } = renderWithProviders(<ReservationsPage />);

    await screen.findByRole("heading", { name: "Planning" });
    expect(screen.queryByRole("heading", { name: "Already approved" })).toBeNull();

    await user.click(within(card("Planning")).getByRole("button", { name: "Approve" }));

    expect(
      await screen.findByText("Reservation status changed to APPROVED."),
    ).toBeInTheDocument();
    expect(requests).toEqual([`PATCH status ${planned.id} APPROVED`]);
    // Approved reservations leave the queue after the list is refreshed.
    expect(await screen.findByText("No reservations are waiting for approval.")).toBeInTheDocument();
  });

  it("archives only after confirmation", async () => {
    signIn(employeeUser);
    const mine = makeReservation({ title: "Mine" });
    const { requests } = backendWith([mine]);
    const confirm = vi.spyOn(window, "confirm");

    const { user } = renderWithProviders(<ReservationsPage />);
    await screen.findByRole("heading", { name: "Mine" });

    confirm.mockReturnValueOnce(false);
    await user.click(within(card("Mine")).getByRole("button", { name: "Archive" }));
    expect(requests).toEqual([]);

    confirm.mockReturnValueOnce(true);
    await user.click(within(card("Mine")).getByRole("button", { name: "Archive" }));

    expect(await screen.findByText("Reservation archived.")).toBeInTheDocument();
    expect(requests).toEqual([`DELETE ${mine.id}`]);
    expect(screen.queryByRole("heading", { name: "Mine" })).toBeNull();
  });

  it("lets an admin restore an archived reservation", async () => {
    signIn(adminUser);
    setNavigation({ pathname: "/reservations", search: "view=archived" });
    const old = makeReservation({ title: "Old", archived: true });
    const { requests } = backendWith([old]);

    const { user } = renderWithProviders(<ReservationsPage />);
    await screen.findByRole("heading", { name: "Old" });

    await user.click(within(card("Old")).getByRole("button", { name: "Restore" }));

    expect(await screen.findByText("Reservation restored.")).toBeInTheDocument();
    expect(requests).toEqual([`PATCH restore ${old.id}`]);
  });

  it("shows the backend's reason when an action is rejected", async () => {
    signIn(adminUser);
    setNavigation({ pathname: "/reservations", search: "view=approval" });
    backendWith([makeReservation({ title: "Planning", status: "PLANNED" })]);
    server.use(
      http.patch(apiUrl("/api/reservations/:id/status"), () =>
        apiError(400, "BAD_REQUEST", "Status cannot be changed from PLANNED to COMPLETED."),
      ),
    );

    const { user } = renderWithProviders(<ReservationsPage />);
    await screen.findByRole("heading", { name: "Planning" });
    await user.click(within(card("Planning")).getByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Status cannot be changed from PLANNED to COMPLETED.",
    );
  });

  it("shows the success message passed by the create page", async () => {
    signIn(employeeUser);
    setNavigation({ pathname: "/reservations", search: "success=created" });
    backendWith([]);

    renderWithProviders(<ReservationsPage />);

    expect(
      await screen.findByText("Reservation created successfully."),
    ).toBeInTheDocument();
  });
});
