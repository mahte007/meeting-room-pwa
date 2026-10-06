import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { combineQueries, QueryState } from "./query-state";
import { setOnline } from "@/test/render";

type FakeQuery = Parameters<typeof combineQueries>[0];

function query(overrides: Partial<NonNullable<FakeQuery>> = {}) {
  return {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    fetchStatus: "idle",
    dataUpdatedAt: 0,
    ...overrides,
  } as NonNullable<FakeQuery>;
}

const loaded = (dataUpdatedAt = 1000) =>
  query({ data: ["x"], dataUpdatedAt });

const loading = () => query({ isPending: true, fetchStatus: "fetching" });

const pausedOffline = () => query({ isPending: true, fetchStatus: "paused" });

const failed = (error = new Error("Boom")) =>
  query({ isError: true, error });

describe("combineQueries", () => {
  it("is ready when every query has data", () => {
    expect(combineQueries(loaded(2000), loaded(1000))).toEqual({
      status: "ready",
      // The oldest data decides how fresh the page is.
      updatedAt: 1000,
      refreshError: null,
    });
  });

  it("is loading while any query is still fetching its first data", () => {
    expect(combineQueries(loaded(), loading()).status).toBe("loading");
  });

  it("reports offline when a query is paused without data", () => {
    expect(combineQueries(loaded(), pausedOffline()).status).toBe("offline");
  });

  it("reports an error when a query failed and has no data", () => {
    const error = new Error("Room not found.");

    expect(combineQueries(loaded(), failed(error))).toEqual({
      status: "error",
      error,
    });
  });

  it("prefers an error over loading, so failures aren't hidden", () => {
    expect(combineQueries(loading(), failed()).status).toBe("error");
  });

  it("stays ready with cached data when a refresh fails", () => {
    const error = new Error("Server down");
    const stale = query({ data: ["x"], dataUpdatedAt: 500, isError: true, error });

    expect(combineQueries(stale)).toEqual({
      status: "ready",
      updatedAt: 500,
      refreshError: error,
    });
  });

  it("ignores queries passed as false, e.g. admin-only data", () => {
    // A disabled query stays pending forever, so it must be skippable.
    const isAdmin = false;
    const employeesQuery = query({ isPending: true });

    expect(combineQueries(loaded(), isAdmin && employeesQuery).status).toBe(
      "ready",
    );
  });
});

describe("QueryState", () => {
  function renderState(state: Parameters<typeof QueryState>[0]["state"]) {
    return render(
      <QueryState state={state} loadingText="Loading rooms..." errorTitle="Failed to load rooms." />,
    );
  }

  it("shows the loading text", () => {
    renderState({ status: "loading" });

    expect(screen.getByText("Loading rooms...")).toBeInTheDocument();
  });

  it("explains that unloaded data needs a connection", () => {
    renderState({ status: "offline" });

    expect(screen.getByText(/hasn't been loaded on this device yet/)).toBeInTheDocument();
  });

  it("shows the error title and message", () => {
    renderState({ status: "error", error: new Error("Room not found.") });

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load rooms.");
    expect(screen.getByRole("alert")).toHaveTextContent("Room not found.");
  });

  it("renders nothing for fresh data", () => {
    const { container } = renderState({ status: "ready", updatedAt: Date.now(), refreshError: null });

    expect(container).toBeEmptyDOMElement();
  });

  it("says how old the data is when it couldn't be refreshed", () => {
    renderState({ status: "ready", updatedAt: Date.now(), refreshError: new Error("Down") });

    expect(screen.getByRole("status")).toHaveTextContent(
      /Couldn't refresh the data. Showing data from/,
    );
  });

  it("says how old the data is while offline", () => {
    setOnline(false);
    renderState({ status: "ready", updatedAt: Date.now(), refreshError: null });

    expect(screen.getByRole("status")).toHaveTextContent(
      /You are offline. Showing data from/,
    );
  });
});
