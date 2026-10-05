import type { Reservation, ReservationStatus } from "./types";

/**
 * Builds iCalendar (.ics, RFC 5545) files that Google Calendar, Outlook and
 * Apple Calendar can import.
 *
 * Reservation times are written as "floating" times (no "Z", no TZID):
 * the calendar app shows them in the device's local time. That matches the
 * backend, whose timestamps have no timezone and mean local time.
 */

const LINE_BREAK = "\r\n";
const MAX_LINE_OCTETS = 75;

const ICS_STATUS: Record<ReservationStatus, string> = {
  PLANNED: "TENTATIVE",
  APPROVED: "CONFIRMED",
  COMPLETED: "CONFIRMED",
  CANCELLED: "CANCELLED",
};

/** Escapes text values: backslash, semicolon, comma and newlines. */
export function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Splits a line into chunks of at most 75 bytes; continuation lines start
 * with a space. Counts UTF-8 bytes, not characters, and never splits a
 * multi-byte character such as "á".
 */
export function foldLine(line: string) {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let current = "";
  let currentOctets = 0;

  for (const char of line) {
    const octets = encoder.encode(char).length;
    // Continuation lines lose one byte to the leading space.
    const limit = chunks.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;

    if (currentOctets + octets > limit) {
      chunks.push(current);
      current = "";
      currentOctets = 0;
    }

    current += char;
    currentOctets += octets;
  }

  chunks.push(current);

  return chunks.join(`${LINE_BREAK} `);
}

/** "2026-10-06T10:00:00" → "20261006T100000" (floating local time). */
export function formatFloatingDateTime(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);

  if (!match) throw new Error(`Invalid date-time: ${value}`);

  const [, year, month, day, hour, minute, second = "00"] = match;
  return `${year}${month}${day}T${hour}${minute}${second}`;
}

/** A Date as a UTC timestamp, e.g. "20261005T201939Z". */
function formatUtcDateTime(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildEvent(reservation: Reservation, stamp: string) {
  const description = [
    reservation.description,
    `Booked by: ${reservation.employeeName}`,
    `Attendees: ${reservation.attendeeCount}`,
    `Status: ${reservation.status}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "BEGIN:VEVENT",
    // Stable per reservation, so re-importing updates the event instead of
    // adding a duplicate.
    `UID:reservation-${reservation.id}@meeting-room-pwa`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatFloatingDateTime(reservation.startTime)}`,
    `DTEND:${formatFloatingDateTime(reservation.endTime)}`,
    `SUMMARY:${escapeText(reservation.title)}`,
    `LOCATION:${escapeText(reservation.roomName)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `STATUS:${ICS_STATUS[reservation.status]}`,
    "END:VEVENT",
  ];
}

export function buildIcsCalendar(
  reservations: Reservation[],
  calendarName = "Meeting room reservations",
) {
  const stamp = formatUtcDateTime(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meeting Room PWA//Reservations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    ...reservations.flatMap((reservation) => buildEvent(reservation, stamp)),
    "END:VCALENDAR",
  ];

  // The format requires CRLF line endings, including after the last line.
  return lines.map(foldLine).join(LINE_BREAK) + LINE_BREAK;
}

/** Makes a safe file name such as "team-sync.ics". */
export function toIcsFileName(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "reservations"}.ics`;
}

/** Starts a download of the reservations as an .ics file. */
export function downloadIcs(
  reservations: Reservation[],
  fileName: string,
  calendarName?: string,
) {
  const blob = new Blob([buildIcsCalendar(reservations, calendarName)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  // Give the browser a moment to start the download before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
