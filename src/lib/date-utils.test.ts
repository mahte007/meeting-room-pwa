import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  isSameDay,
  isValidDateTime,
  parseLocalDate,
  roundedHoursFromNow,
  startOfWeek,
  toLocalDateTimeInputValue,
  toLocalDateValue,
  withSeconds,
} from "./date-utils";

describe("toLocalDateTimeInputValue", () => {
  it("formats local time without converting to UTC", () => {
    // 00:30 on 1 Jan in Budapest (UTC+1) is still 31 Dec in UTC, which is
    // what toISOString() would give.
    const date = new Date(2026, 0, 1, 0, 30);

    expect(date.toISOString().startsWith("2025-12-31")).toBe(true);
    expect(toLocalDateTimeInputValue(date)).toBe("2026-01-01T00:30");
  });

  it("zero-pads every part", () => {
    expect(toLocalDateTimeInputValue(new Date(2026, 0, 5, 7, 3))).toBe(
      "2026-01-05T07:03",
    );
  });
});

describe("toLocalDateValue", () => {
  it("returns the local date", () => {
    expect(toLocalDateValue(new Date(2026, 9, 6, 0, 15))).toBe("2026-10-06");
  });
});

describe("withSeconds", () => {
  it("adds seconds to a datetime-local value", () => {
    expect(withSeconds("2026-10-06T10:00")).toBe("2026-10-06T10:00:00");
  });

  it("leaves a value that already has seconds unchanged", () => {
    expect(withSeconds("2026-10-06T10:00:30")).toBe("2026-10-06T10:00:30");
  });
});

describe("roundedHoursFromNow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the start of the hour the given number of hours ahead", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 6, 9, 47, 12));

    expect(roundedHoursFromNow(1)).toBe("2026-10-06T10:00");
    expect(roundedHoursFromNow(2)).toBe("2026-10-06T11:00");
  });

  it("rolls over to the next day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 6, 23, 10));

    expect(roundedHoursFromNow(1)).toBe("2026-10-07T00:00");
  });
});

describe("isValidDateTime", () => {
  it.each([
    ["2026-10-06T10:00", true],
    ["2026-10-06T10:00:00", true],
    ["not a date", false],
    ["", false],
    [null, false],
    [undefined, false],
  ])("%s → %s", (value, expected) => {
    expect(isValidDateTime(value)).toBe(expected);
  });
});

describe("parseLocalDate", () => {
  it("parses YYYY-MM-DD as local midnight", () => {
    const date = parseLocalDate("2026-10-06");

    expect(date).toEqual(new Date(2026, 9, 6));
  });

  it.each(["06-10-2026", "2026-10-6", "garbage", "", null, undefined])(
    "rejects %s",
    (value) => {
      expect(parseLocalDate(value)).toBeNull();
    },
  );
});

describe("addDays", () => {
  it("does not modify the original date", () => {
    const original = new Date(2026, 9, 6);
    addDays(original, 3);

    expect(original).toEqual(new Date(2026, 9, 6));
  });

  it("crosses month boundaries", () => {
    expect(addDays(new Date(2026, 9, 30), 3)).toEqual(new Date(2026, 10, 2));
  });

  it("keeps local midnight across a daylight saving change", () => {
    // Clocks go back on 25 Oct 2026 in Europe/Budapest.
    expect(addDays(new Date(2026, 9, 24), 2)).toEqual(new Date(2026, 9, 26));
  });
});

describe("startOfWeek", () => {
  it("returns Monday 00:00 for a midweek date", () => {
    // Thursday 8 Oct 2026.
    expect(startOfWeek(new Date(2026, 9, 8, 15, 30))).toEqual(
      new Date(2026, 9, 5),
    );
  });

  it("treats Sunday as the end of the week, not the start", () => {
    // Sunday 11 Oct 2026 belongs to the week starting Monday 5 Oct.
    expect(startOfWeek(new Date(2026, 9, 11))).toEqual(new Date(2026, 9, 5));
  });

  it("returns the same day for a Monday", () => {
    expect(startOfWeek(new Date(2026, 9, 5, 8))).toEqual(new Date(2026, 9, 5));
  });
});

describe("isSameDay", () => {
  it("compares calendar days, ignoring time", () => {
    expect(isSameDay(new Date(2026, 9, 6, 0, 0), new Date(2026, 9, 6, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 9, 6, 23, 59), new Date(2026, 9, 7, 0, 0))).toBe(false);
  });
});
