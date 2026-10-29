import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./redirect";

describe("getSafeRedirect", () => {
  it.each([
    ["/reservations", "/reservations"],
    ["/reservations?view=mine", "/reservations?view=mine"],
    ["/rooms/2#details", "/rooms/2#details"],
  ])("keeps the same-origin path %s", (value, expected) => {
    expect(getSafeRedirect(value)).toBe(expected);
  });

  it.each([
    [null],
    [""],
    ["reservations"],
    ["https://evil.example"],
    ["//evil.example"],
    [String.raw`/\evil.example`],
    [String.raw`\\evil.example`],
    ["javascript:alert(1)"],
    // Browsers drop tabs and newlines from URLs, turning these into
    // "//evil.example", which points to another site.
    ["/\t/evil.example"],
    ["/\n/evil.example"],
    ["\t//evil.example"],
  ])("falls back to the dashboard for %j", (value) => {
    expect(getSafeRedirect(value)).toBe("/");
  });

  it("does not redirect back to the login page", () => {
    expect(getSafeRedirect("/login")).toBe("/");
    expect(getSafeRedirect("/login?redirect=/rooms")).toBe("/");
  });
});
