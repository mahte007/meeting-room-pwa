"use client";

import Link from "next/link";
import {
  getDaySegments,
  getVisibleHours,
  layoutDaySegments,
  type PositionedSegment,
} from "@/lib/calendar-layout";
import { addDays, isSameDay } from "@/lib/date-utils";
import type { Reservation, ReservationStatus } from "@/lib/types";

const HOUR_HEIGHT = 48;
const PX_PER_MINUTE = HOUR_HEIGHT / 60;
const MIN_EVENT_HEIGHT = 20;

const statusClasses: Record<ReservationStatus, string> = {
  PLANNED: "border-amber-400 bg-amber-50 text-amber-900",
  APPROVED: "border-emerald-500 bg-emerald-50 text-emerald-900",
  COMPLETED: "border-slate-400 bg-slate-100 text-slate-700",
  CANCELLED: "border-red-400 bg-red-50 text-red-800 line-through",
};

export const STATUS_LEGEND: { status: ReservationStatus; label: string }[] = [
  { status: "PLANNED", label: "Planned" },
  { status: "APPROVED", label: "Approved" },
  { status: "COMPLETED", label: "Completed" },
];

export function statusClassName(status: ReservationStatus) {
  return statusClasses[status];
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type WeekCalendarProps = {
  weekStart: Date;
  reservations: Reservation[];
  showRoomNames: boolean;
  // Where clicking a reservation goes.
  getReservationHref: (reservation: Reservation) => string;
  // Called with the start of a clicked empty hour slot in the future.
  onSlotClick?: (start: Date) => void;
};

export function WeekCalendar({
  weekStart,
  reservations,
  showRoomNames,
  getReservationHref,
  onSlotClick,
}: WeekCalendarProps) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const segmentsByDay = days.map((day) => getDaySegments(reservations, day));
  const { startHour, endHour } = getVisibleHours(segmentsByDay.flat());
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );

  function renderSegment(segment: PositionedSegment) {
    const { reservation } = segment;
    const top = (segment.startMinutes - startHour * 60) * PX_PER_MINUTE;
    const height = Math.max(
      (segment.endMinutes - segment.startMinutes) * PX_PER_MINUTE,
      MIN_EVENT_HEIGHT,
    );
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    const timeRange = `${formatTime(start)}–${formatTime(end)}`;

    return (
      <Link
        key={reservation.id}
        href={getReservationHref(reservation)}
        title={`${reservation.title}\n${timeRange}\n${reservation.roomName} · ${reservation.employeeName}\n${reservation.status}`}
        aria-label={`${reservation.title}, ${timeRange}, ${reservation.roomName}, ${reservation.status}`}
        className={`absolute overflow-hidden rounded-md border-l-4 px-1.5 py-0.5 text-xs shadow-sm transition hover:z-10 hover:shadow-md ${statusClassName(
          reservation.status,
        )}`}
        style={{
          top,
          height,
          left: `calc(${(segment.lane / segment.laneCount) * 100}% + 2px)`,
          width: `calc(${100 / segment.laneCount}% - 4px)`,
        }}
      >
        <p className="truncate font-semibold">{reservation.title}</p>
        {height >= 36 && <p className="truncate">{timeRange}</p>}
        {showRoomNames && height >= 52 && (
          <p className="truncate">{reservation.roomName}</p>
        )}
      </Link>
    );
  }

  return (
    // The grid needs room for seven columns, so it scrolls sideways inside
    // this box on narrow screens instead of widening the page.
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b">
          <div />
          {days.map((day) => {
            const isToday = isSameDay(day, now);

            return (
              <div
                key={day.toISOString()}
                className={`border-l px-2 py-2 text-center text-sm ${
                  isToday ? "bg-slate-900 text-white" : "text-slate-700"
                }`}
              >
                <span className="block text-xs uppercase tracking-wide opacity-75">
                  {day.toLocaleDateString([], { weekday: "short" })}
                </span>
                <span className="font-semibold">
                  {day.toLocaleDateString([], {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)]">
          <div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="pr-2 text-right text-xs text-slate-500"
                style={{ height: HOUR_HEIGHT }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => (
            <div
              key={day.toISOString()}
              className="relative border-l"
              style={{ height: hours.length * HOUR_HEIGHT }}
            >
              {hours.map((hour) => {
                const slotStart = new Date(day);
                slotStart.setHours(hour, 0, 0, 0);
                const isPast = slotStart < now;
                const clickable = !!onSlotClick && !isPast;

                return (
                  // Mouse shortcut only; keyboard users have the
                  // "New reservation" button.
                  <div
                    key={hour}
                    aria-hidden="true"
                    onClick={clickable ? () => onSlotClick(slotStart) : undefined}
                    className={`border-b border-slate-100 ${
                      isPast
                        ? "bg-slate-50/70"
                        : clickable
                          ? "cursor-pointer hover:bg-sky-50"
                          : ""
                    }`}
                    style={{ height: HOUR_HEIGHT }}
                  />
                );
              })}

              {layoutDaySegments(segmentsByDay[dayIndex]).map(renderSegment)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
