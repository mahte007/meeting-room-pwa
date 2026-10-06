import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import AvailableRoomsPage from "./page";
import { employeeUser } from "@/test/fixtures";
import { setNavigation } from "@/test/navigation";
import { renderWithProviders, signIn } from "@/test/render";
import { apiUrl, server } from "@/test/server";
import type { Room } from "@/lib/types";

const freeRooms: Room[] = [
  { id: 1, name: "Small", capacity: 4, location: "1st floor", hasProjector: true, active: true },
  { id: 2, name: "Large", capacity: 12, location: "2nd floor", hasProjector: false, active: true },
  { id: 3, name: "Hall", capacity: 30, location: "Ground floor", hasProjector: true, active: true },
];

function searchFor(search: string) {
  const requests: URL[] = [];

  setNavigation({ pathname: "/rooms/available", search });
  server.use(
    http.get(apiUrl("/api/rooms/available"), ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(freeRooms);
    }),
  );
  renderWithProviders(<AvailableRoomsPage />);

  return requests;
}

/** Names of the rooms in the results, once they have loaded. */
async function resultNames() {
  const headings = await screen.findAllByRole("heading", { level: 3 });
  return headings.map((heading) => heading.textContent);
}

describe("AvailableRoomsPage", () => {
  it("asks the backend for the time range in its date format", async () => {
    signIn(employeeUser);
    const requests = searchFor("start=2030-01-07T10:00&end=2030-01-07T11:00&attendees=1");

    await resultNames();

    expect(requests[0].searchParams.get("start")).toBe("2030-01-07T10:00:00");
    expect(requests[0].searchParams.get("end")).toBe("2030-01-07T11:00:00");
  });

  it("hides rooms that are too small, since the backend ignores capacity", async () => {
    signIn(employeeUser);
    searchFor("start=2030-01-07T10:00&end=2030-01-07T11:00&attendees=10");

    expect(await resultNames()).toEqual(["Large", "Hall"]);
  });

  it("hides rooms without a projector when one is needed", async () => {
    signIn(employeeUser);
    searchFor("start=2030-01-07T10:00&end=2030-01-07T11:00&attendees=10&projector=1");

    expect(await resultNames()).toEqual(["Hall"]);
  });

  it("explains when free rooms exist but none fit", async () => {
    signIn(employeeUser);
    searchFor("start=2030-01-07T10:00&end=2030-01-07T11:00&attendees=50");

    expect(
      await screen.findByText(/3 free room\(s\) are too small or lack a projector/),
    ).toBeInTheDocument();
  });

  it("links each result to a prefilled booking form", async () => {
    signIn(employeeUser);
    searchFor("start=2030-01-07T10:00&end=2030-01-07T11:00&attendees=10");

    const hall = (await screen.findByRole("heading", { name: "Hall" })).closest("article")!;
    const href = within(hall).getByRole("link", { name: "Book" }).getAttribute("href")!;

    const params = new URL(href, "http://app.test").searchParams;
    expect(Object.fromEntries(params)).toEqual({
      roomId: "3",
      start: "2030-01-07T10:00",
      end: "2030-01-07T11:00",
      attendees: "10",
    });
  });

  it("does not search until the URL holds a complete, valid range", () => {
    signIn(employeeUser);
    // End before start: no request should be made (an unexpected request
    // would fail the test).
    setNavigation({
      pathname: "/rooms/available",
      search: "start=2030-01-07T11:00&end=2030-01-07T10:00",
    });

    renderWithProviders(<AvailableRoomsPage />);

    expect(screen.queryByText(/Free rooms for/)).toBeNull();
  });
});
