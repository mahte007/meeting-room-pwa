import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredAuthUser,
  getStoredAuthUser,
  getTokenExpiry,
  isTokenExpired,
  storeAuthUser,
  subscribeToAuthUser,
} from "./auth-storage";
import type { AuthUser } from "./types";

const user: AuthUser = {
  username: "mate",
  role: "EMPLOYEE",
  token: "token",
  employeeId: 1,
  employeeName: "Máté Horváth",
};

/** Builds an unsigned JWT with the given payload; only the payload matters. */
function jwt(payload: object) {
  const base64Url = (value: string) =>
    btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${base64Url('{"alg":"none"}')}.${base64Url(JSON.stringify(payload))}.`;
}

describe("stored auth user", () => {
  it("returns null when nobody is signed in", () => {
    expect(getStoredAuthUser()).toBeNull();
  });

  it("stores and reads back the user", () => {
    storeAuthUser(user);

    expect(getStoredAuthUser()).toEqual(user);
  });

  it("returns the same object until the stored value changes", () => {
    // useSyncExternalStore re-renders forever if this isn't stable.
    storeAuthUser(user);

    expect(getStoredAuthUser()).toBe(getStoredAuthUser());
  });

  it("discards corrupted data", () => {
    localStorage.setItem("meeting-room-auth", "{not json");

    expect(getStoredAuthUser()).toBeNull();
    expect(localStorage.getItem("meeting-room-auth")).toBeNull();
  });

  it("notifies subscribers on sign-in and sign-out", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthUser(listener);

    storeAuthUser(user);
    clearStoredAuthUser();
    unsubscribe();
    storeAuthUser(user);

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("notifies subscribers when another tab signs out", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAuthUser(listener);

    window.dispatchEvent(
      new StorageEvent("storage", { key: "meeting-room-auth" }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("token expiry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads exp from the token in milliseconds", () => {
    expect(getTokenExpiry(jwt({ sub: "mate", exp: 1_800_000_000 }))).toBe(
      1_800_000_000_000,
    );
  });

  it("handles base64url characters in the payload", () => {
    // "?" characters encode to "_" and "/" in base64url and base64.
    expect(getTokenExpiry(jwt({ note: "???>>>", exp: 42 }))).toBe(42_000);
  });

  it.each([["not-a-jwt"], ["a.!!!.c"], [jwt({ sub: "no expiry" })]])(
    "returns null for %s",
    (token) => {
      expect(getTokenExpiry(token)).toBeNull();
    },
  );

  it("is expired only once exp has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1_000_000));
    const token = jwt({ exp: 1_000 }); // 1,000,000 ms

    expect(isTokenExpired(token)).toBe(true);

    vi.setSystemTime(new Date(999_999));
    expect(isTokenExpired(token)).toBe(false);
  });

  it("never treats a token without exp as expired", () => {
    // e.g. the mock backend's tokens.
    expect(isTokenExpired("mock-jwt-token:mate")).toBe(false);
  });
});
