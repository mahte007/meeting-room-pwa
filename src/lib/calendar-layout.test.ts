import { describe, expect, it } from "vitest";
import {
  getDaySegments,
  getVisibleHours,
  layoutDaySegments,
  type DaySegment,
} from "./calendar-layout";
import type { Reservation } from "./types";

function reservation(
  id: number,
  startTime: string,
  endTime: string,
): Reservation {
  return {
    id,
    title: `Reservation ${id}`,
    description: null,
    startTime,
    endTime,
    attendeeCount: 1,
    status: "APPROVED",
    archived: false,
    employeeId: 1,
    employeeName: "Test Employee",
    roomId: 1,
    roomName: "Room A",
  };
}

const day = new Date(2026, 9, 6); // 6 Oct 2026

function segment(startMinutes: number, endMinutes: number, id = 1): DaySegment {
  return {
    reservation: reservation(id, "", ""),
    startMinutes,
    endMinutes,
  };
}

describe("getDaySegments", () => {
  it("returns minutes since midnight for a reservation on that day", () => {
    const [result] = getDaySegments(
      [reservation(1, "2026-10-06T10:00:00", "2026-10-06T11:30:00")],
      day,
    );

    expect(result.startMinutes).toBe(600);
    expect(result.endMinutes).toBe(690);
  });

  it("ignores reservations on other days", () => {
    const segments = getDaySegments(
      [
        reservation(1, "2026-10-05T10:00:00", "2026-10-05T11:00:00"),
        reservation(2, "2026-10-07T10:00:00", "2026-10-07T11:00:00"),
      ],
      day,
    );

    expect(segments).toEqual([]);
  });

  it("excludes a reservation that ends exactly at midnight from the next day", () => {
    const ending = reservation(1, "2026-10-05T23:00:00", "2026-10-06T00:00:00");

    expect(getDaySegments([ending], day)).toEqual([]);
  });

  it("splits a reservation that spans midnight across both days", () => {
    const overnight = reservation(
      1,
      "2026-10-06T22:00:00",
      "2026-10-07T02:00:00",
    );

    const [first] = getDaySegments([overnight], day);
    const [second] = getDaySegments([overnight], new Date(2026, 9, 7));

    expect([first.startMinutes, first.endMinutes]).toEqual([1320, 1440]);
    expect([second.startMinutes, second.endMinutes]).toEqual([0, 120]);
  });

  // In Europe/Budapest clocks jump from 02:00 to 03:00 on 29 March 2026, so
  // that day has only 23 hours. Positions must follow the wall clock, not
  // the time elapsed since midnight.
  it("places reservations by wall-clock time on a daylight saving day", () => {
    const [result] = getDaySegments(
      [reservation(1, "2026-03-29T10:00:00", "2026-03-29T11:00:00")],
      new Date(2026, 2, 29),
    );

    expect(result.startMinutes).toBe(600);
    expect(result.endMinutes).toBe(660);
  });

  it("places reservations by wall-clock time when clocks go back", () => {
    // 25 October 2026 has 25 hours.
    const [result] = getDaySegments(
      [reservation(1, "2026-10-25T10:00:00", "2026-10-25T11:00:00")],
      new Date(2026, 9, 25),
    );

    expect(result.startMinutes).toBe(600);
    expect(result.endMinutes).toBe(660);
  });
});

describe("layoutDaySegments", () => {
  function lanes(segments: DaySegment[]) {
    return layoutDaySegments(segments).map((s) => ({
      id: s.reservation.id,
      lane: s.lane,
      laneCount: s.laneCount,
    }));
  }

  it("gives a lone segment the full width", () => {
    expect(lanes([segment(600, 660)])).toEqual([
      { id: 1, lane: 0, laneCount: 1 },
    ]);
  });

  it("puts overlapping segments side by side", () => {
    expect(lanes([segment(540, 600, 1), segment(570, 660, 2)])).toEqual([
      { id: 1, lane: 0, laneCount: 2 },
      { id: 2, lane: 1, laneCount: 2 },
    ]);
  });

  it("keeps back-to-back segments full width", () => {
    expect(lanes([segment(540, 600, 1), segment(600, 660, 2)])).toEqual([
      { id: 1, lane: 0, laneCount: 1 },
      { id: 2, lane: 0, laneCount: 1 },
    ]);
  });

  it("reuses a lane once it is free within the same cluster", () => {
    // 1 and 2 overlap; 3 starts when 1 ends but still overlaps 2.
    expect(
      lanes([segment(540, 600, 1), segment(570, 660, 2), segment(600, 630, 3)]),
    ).toEqual([
      { id: 1, lane: 0, laneCount: 2 },
      { id: 2, lane: 1, laneCount: 2 },
      { id: 3, lane: 0, laneCount: 2 },
    ]);
  });

  it("sizes separate clusters independently", () => {
    const result = lanes([
      segment(540, 600, 1),
      segment(550, 600, 2),
      segment(780, 840, 3),
    ]);

    expect(result.map((r) => r.laneCount)).toEqual([2, 2, 1]);
  });

  it("does not depend on input order", () => {
    const ordered = lanes([segment(540, 600, 1), segment(570, 660, 2)]);
    const reversed = lanes([segment(570, 660, 2), segment(540, 600, 1)]);

    expect(reversed).toEqual(ordered);
  });
});

describe("getVisibleHours", () => {
  it("defaults to a working day", () => {
    expect(getVisibleHours([])).toEqual({ startHour: 8, endHour: 18 });
  });

  it("widens to fit early and late segments", () => {
    expect(getVisibleHours([segment(390, 450), segment(1200, 1290)])).toEqual({
      startHour: 6,
      endHour: 22,
    });
  });
});
