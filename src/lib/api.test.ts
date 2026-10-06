import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  ApiError,
  getAvailableRooms,
  getErrorDetails,
} from "./api";
import { getStoredAuthUser, storeAuthUser } from "./auth-storage";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function signIn() {
  storeAuthUser({
    username: "mate",
    role: "EMPLOYEE",
    token: "secret-token",
    employeeId: 1,
    employeeName: "Máté Horváth",
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

describe("apiFetch", () => {
  it("prefixes the API base URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await apiFetch("/api/rooms");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/rooms",
      expect.anything(),
    );
  });

  it("sends the bearer token when signed in", async () => {
    signIn();
    fetchMock.mockResolvedValue(jsonResponse([]));

    await apiFetch("/api/rooms");

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
  });

  it("sends no Authorization header when signed out", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await apiFetch("/api/rooms");

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers).not.toHaveProperty("Authorization");
  });

  it("returns the parsed JSON body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1, name: "Room A" }));

    await expect(apiFetch("/api/rooms/1")).resolves.toEqual({
      id: 1,
      name: "Room A",
    });
  });

  it("returns undefined for an empty 200 response", async () => {
    // DELETE and password endpoints answer 200 with no body.
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await expect(apiFetch("/api/reservations/1")).resolves.toBeUndefined();
  });

  it("throws an ApiError with the backend's message and field errors", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: "VALIDATION_ERROR",
          message: "Validation failed.",
          fields: { title: "Title is required." },
          timestamp: "2026-10-06T10:00:00",
        },
        400,
      ),
    );

    const error: unknown = await apiFetch("/api/reservations").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: "Validation failed.",
      payload: { fields: { title: "Title is required." } },
    });
  });

  it("falls back to a generic message when the error body isn't JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

    await expect(apiFetch("/api/rooms")).rejects.toThrow(
      "Request failed with status 502",
    );
  });

  it("signs the user out when an authenticated request gets a 401", async () => {
    signIn();
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: "UNAUTHORIZED", message: "Authentication required.", timestamp: "" },
        401,
      ),
    );

    await expect(apiFetch("/api/rooms")).rejects.toThrow(ApiError);
    expect(getStoredAuthUser()).toBeNull();
  });

  it("keeps the user signed in on a 403", async () => {
    signIn();
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: "FORBIDDEN", message: "No permission.", timestamp: "" },
        403,
      ),
    );

    await expect(apiFetch("/api/employees")).rejects.toThrow("No permission.");
    expect(getStoredAuthUser()).not.toBeNull();
  });
});

describe("getAvailableRooms", () => {
  it("passes the time range as encoded query parameters", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await getAvailableRooms("2026-10-06T10:00:00", "2026-10-06T11:00:00");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://api.test/api/rooms/available?start=2026-10-06T10%3A00%3A00&end=2026-10-06T11%3A00%3A00",
    );
  });
});

describe("getErrorDetails", () => {
  it("returns the message and field errors of an ApiError", () => {
    const error = new ApiError("Validation failed.", 400, {
      error: "VALIDATION_ERROR",
      message: "Validation failed.",
      timestamp: "",
      fields: { capacity: "Capacity must be at least 1." },
    });

    expect(getErrorDetails(error, "Fallback")).toEqual({
      message: "Validation failed.",
      fields: { capacity: "Capacity must be at least 1." },
    });
  });

  it("hides unexpected errors behind the fallback message", () => {
    // e.g. a TypeError from a network failure, which isn't user-friendly.
    expect(getErrorDetails(new TypeError("Failed to fetch"), "Fallback")).toEqual(
      { message: "Fallback", fields: {} },
    );
  });
});
