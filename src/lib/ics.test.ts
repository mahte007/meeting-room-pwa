import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildIcsCalendar,
  escapeText,
  foldLine,
  formatFloatingDateTime,
  toIcsFileName,
} from "./ics";
import type { Reservation } from "./types";

const reservation: Reservation = {
  id: 7,
  title: "Team sync, weekly",
  description: "Agenda;\nnotes",
  startTime: "2026-10-06T10:00:00",
  endTime: "2026-10-06T11:30:00",
  attendeeCount: 5,
  status: "PLANNED",
  archived: false,
  employeeId: 1,
  employeeName: "Máté Horváth",
  roomId: 1,
  roomName: "Room A",
};

const encoder = new TextEncoder();

/** Undoes line folding, as a calendar app does when reading the file. */
function unfold(ics: string) {
  return ics.replace(/\r\n /g, "");
}

describe("escapeText", () => {
  it("escapes backslashes, semicolons, commas and newlines", () => {
    expect(escapeText(String.raw`a,b;c\d` + "\ne")).toBe(
      String.raw`a\,b\;c\\d\ne`,
    );
  });

  it("escapes the backslash first so other escapes aren't doubled", () => {
    expect(escapeText(";")).toBe(String.raw`\;`);
  });
});

describe("foldLine", () => {
  it("leaves short lines alone", () => {
    expect(foldLine("SUMMARY:Short")).toBe("SUMMARY:Short");
  });

  it("keeps every physical line within 75 bytes", () => {
    const folded = foldLine("DESCRIPTION:" + "x".repeat(300));

    for (const line of folded.split("\r\n")) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("counts bytes, not characters, and never splits a character", () => {
    // "á" is 2 bytes in UTF-8, so 75 characters of it would be 150 bytes.
    const line = "DESCRIPTION:" + "Máté Horváth ".repeat(20);
    const folded = foldLine(line);

    for (const physical of folded.split("\r\n")) {
      expect(encoder.encode(physical).length).toBeLessThanOrEqual(75);
    }
    expect(unfold(folded)).toBe(line);
  });
});

describe("formatFloatingDateTime", () => {
  it("formats backend date-times without a timezone", () => {
    expect(formatFloatingDateTime("2026-10-06T10:00:00")).toBe("20261006T100000");
  });

  it("accepts values without seconds", () => {
    expect(formatFloatingDateTime("2026-10-06T10:00")).toBe("20261006T100000");
  });

  it("rejects invalid values", () => {
    expect(() => formatFloatingDateTime("tomorrow")).toThrow();
  });
});

describe("buildIcsCalendar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses CRLF line endings throughout, including the last line", () => {
    const ics = buildIcsCalendar([reservation]);

    expect(ics).not.toMatch(/[^\r]\n/);
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("writes one event with floating times and escaped text", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 9, 5, 20, 19, 39)));

    const lines = unfold(buildIcsCalendar([reservation])).split("\r\n");

    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("UID:reservation-7@meeting-room-pwa");
    expect(lines).toContain("DTSTAMP:20261005T201939Z");
    expect(lines).toContain("DTSTART:20261006T100000");
    expect(lines).toContain("DTEND:20261006T113000");
    expect(lines).toContain(String.raw`SUMMARY:Team sync\, weekly`);
    expect(lines).toContain("LOCATION:Room A");
    expect(lines).toContain("STATUS:TENTATIVE");
    expect(lines).toContain(
      String.raw`DESCRIPTION:Agenda\;\nnotes\nBooked by: Máté Horváth\nAttendees: 5\nStatus: PLANNED`,
    );
  });

  it("maps reservation statuses to calendar statuses", () => {
    const statusOf = (status: Reservation["status"]) =>
      unfold(buildIcsCalendar([{ ...reservation, status }]))
        .split("\r\n")
        .find((line) => line.startsWith("STATUS:"));

    expect(statusOf("PLANNED")).toBe("STATUS:TENTATIVE");
    expect(statusOf("APPROVED")).toBe("STATUS:CONFIRMED");
    expect(statusOf("COMPLETED")).toBe("STATUS:CONFIRMED");
    expect(statusOf("CANCELLED")).toBe("STATUS:CANCELLED");
  });

  it("writes one event per reservation", () => {
    const ics = buildIcsCalendar([reservation, { ...reservation, id: 8 }]);

    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  it("still produces a valid empty calendar", () => {
    const ics = buildIcsCalendar([]);

    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  it("leaves out a missing description", () => {
    const lines = unfold(
      buildIcsCalendar([{ ...reservation, description: null }]),
    ).split("\r\n");

    expect(lines).toContain(
      String.raw`DESCRIPTION:Booked by: Máté Horváth\nAttendees: 5\nStatus: PLANNED`,
    );
  });
});

describe("toIcsFileName", () => {
  it.each([
    ["Team sync", "team-sync.ics"],
    ["Máté's reservations!", "mate-s-reservations.ics"],
    ["  --weird__name--  ", "weird-name.ics"],
    ["!!!", "reservations.ics"],
  ])("%s → %s", (name, expected) => {
    expect(toIcsFileName(name)).toBe(expected);
  });
});
