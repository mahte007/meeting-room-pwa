import { addDays } from "./date-utils";
import type { Reservation } from "./types";

/** The part of a reservation that falls on one calendar day. */
export type DaySegment = {
  reservation: Reservation;
  // Minutes since midnight of that day.
  startMinutes: number;
  endMinutes: number;
};

/** A segment placed side by side with the segments it overlaps. */
export type PositionedSegment = DaySegment & {
  lane: number;
  laneCount: number;
};

const MINUTES_PER_DAY = 24 * 60;

/**
 * Cuts reservations down to the parts that fall on `day`. A reservation that
 * spans midnight shows up on each day it touches.
 */
export function getDaySegments(
  reservations: Reservation[],
  day: Date,
): DaySegment[] {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = addDays(dayStart, 1);

  return reservations.flatMap((reservation) => {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);

    if (end <= dayStart || start >= dayEnd) return [];

    const toMinutes = (date: Date) =>
      Math.round((date.getTime() - dayStart.getTime()) / 60_000);

    return [
      {
        reservation,
        startMinutes: Math.max(0, toMinutes(start)),
        endMinutes: Math.min(MINUTES_PER_DAY, toMinutes(end)),
      },
    ];
  });
}

/**
 * Assigns overlapping segments to side-by-side lanes, like most calendar
 * apps. Segments that overlap, directly or through a chain of overlaps, form
 * a cluster; every segment in a cluster gets the same width (1 / laneCount)
 * and takes the first lane that is free when it starts.
 */
export function layoutDaySegments(segments: DaySegment[]): PositionedSegment[] {
  const sorted = [...segments].sort(
    (a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes,
  );

  const positioned: PositionedSegment[] = [];
  let cluster: PositionedSegment[] = [];
  // End time of the last segment in each lane of the current cluster.
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  function closeCluster() {
    for (const segment of cluster) segment.laneCount = laneEnds.length;
    positioned.push(...cluster);
    cluster = [];
    laneEnds = [];
  }

  for (const segment of sorted) {
    // Touching is not overlapping: 10:00–11:00 and 11:00–12:00 share a lane.
    if (segment.startMinutes >= clusterEnd) closeCluster();

    let lane = laneEnds.findIndex((end) => end <= segment.startMinutes);

    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(segment.endMinutes);
    } else {
      laneEnds[lane] = segment.endMinutes;
    }

    cluster.push({ ...segment, lane, laneCount: 1 });
    clusterEnd = Math.max(clusterEnd, segment.endMinutes);
  }

  closeCluster();

  return positioned;
}

/**
 * The hours to show: a default working day, widened to fit any segment that
 * starts earlier or ends later.
 */
export function getVisibleHours(
  segments: DaySegment[],
  defaultStart = 8,
  defaultEnd = 18,
) {
  let startHour = defaultStart;
  let endHour = defaultEnd;

  for (const segment of segments) {
    startHour = Math.min(startHour, Math.floor(segment.startMinutes / 60));
    endHour = Math.max(endHour, Math.ceil(segment.endMinutes / 60));
  }

  return { startHour, endHour };
}
