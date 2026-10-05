"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  STATUS_LEGEND,
  statusClassName,
  WeekCalendar,
} from "@/components/calendar/week-calendar";
import { inputClassName } from "@/components/ui/form-field";
import { QueryState } from "@/components/ui/query-state";
import { useAuth } from "@/contexts/auth-context";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getActiveReservations, getActiveRooms } from "@/lib/api";
import {
  addDays,
  parseLocalDate,
  startOfWeek,
  toLocalDateTimeInputValue,
  toLocalDateValue,
} from "@/lib/date-utils";
import { FINAL_STATUSES, type Reservation } from "@/lib/types";

const navButtonClassName =
  "rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50";

function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const weekStart = startOfWeek(
    parseLocalDate(searchParams.get("week")) ?? new Date(),
  );
  const weekEnd = addDays(weekStart, 7);
  const roomFilter = Number(searchParams.get("room")) || null;

  const reservationsQuery = useQuery({
    queryKey: ["reservations", "active"],
    queryFn: getActiveReservations,
  });

  const roomsQuery = useQuery({
    queryKey: ["rooms", "active"],
    queryFn: getActiveRooms,
  });

  // Cancelled reservations free their slot, so they are left out.
  const reservations = (reservationsQuery.data ?? []).filter(
    (reservation) =>
      reservation.status !== "CANCELLED" &&
      (roomFilter === null || reservation.roomId === roomFilter),
  );

  const weekCount = reservations.filter(
    (r) => new Date(r.startTime) < weekEnd && new Date(r.endTime) > weekStart,
  ).length;

  function hrefWith(changes: { week?: Date | null; room?: number | null }) {
    const params = new URLSearchParams(searchParams);

    if (changes.week !== undefined) {
      if (changes.week) params.set("week", toLocalDateValue(changes.week));
      else params.delete("week");
    }

    if (changes.room !== undefined) {
      if (changes.room) params.set("room", String(changes.room));
      else params.delete("room");
    }

    const query = params.toString();
    return query ? `/calendar?${query}` : "/calendar";
  }

  function getReservationHref(reservation: Reservation) {
    const canEdit =
      (isAdmin || reservation.employeeId === user?.employeeId) &&
      !FINAL_STATUSES.includes(reservation.status);

    return canEdit
      ? `/reservations/${reservation.id}/edit`
      : `/rooms/${reservation.roomId}`;
  }

  function handleSlotClick(start: Date) {
    const params = new URLSearchParams({
      start: toLocalDateTimeInputValue(start),
      end: toLocalDateTimeInputValue(new Date(start.getTime() + 3_600_000)),
    });

    if (roomFilter) params.set("roomId", String(roomFilter));

    router.push(`/reservations/new?${params}`);
  }

  const weekLabel = `${weekStart.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  })} – ${addDays(weekStart, 6).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  const isLoading = reservationsQuery.isLoading || roomsQuery.isLoading;
  const isError = reservationsQuery.isError || roomsQuery.isError;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={hrefWith({ week: addDays(weekStart, -7) })}
            className={navButtonClassName}
            aria-label="Previous week"
          >
            ←
          </Link>
          <Link href={hrefWith({ week: null })} className={navButtonClassName}>
            Today
          </Link>
          <Link
            href={hrefWith({ week: addDays(weekStart, 7) })}
            className={navButtonClassName}
            aria-label="Next week"
          >
            →
          </Link>
          <h2 className="ml-2 text-lg font-semibold" aria-live="polite">
            {weekLabel}
          </h2>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label
              htmlFor="room-filter"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Room
            </label>
            <select
              id="room-filter"
              value={roomFilter ?? ""}
              onChange={(e) =>
                router.replace(
                  hrefWith({ room: Number(e.target.value) || null }),
                )
              }
              className={`${inputClassName} py-2`}
            >
              <option value="">All rooms</option>
              {(roomsQuery.data ?? []).map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {isOnline && (
            <Link
              href="/reservations/new"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              New reservation
            </Link>
          )}
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={reservationsQuery.error || roomsQuery.error}
        loadingText="Loading calendar..."
        errorTitle="Failed to load calendar."
      />

      {!isLoading && !isError && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>
              {weekCount === 0
                ? "No reservations this week."
                : `${weekCount} reservation${weekCount === 1 ? "" : "s"} this week.`}
              {isOnline && " Click an empty slot to book it."}
            </p>

            <ul className="flex flex-wrap gap-3" aria-label="Status legend">
              {STATUS_LEGEND.map(({ status, label }) => (
                <li key={status} className="flex items-center gap-1.5">
                  <span
                    className={`h-3 w-3 rounded-sm border-l-4 ${statusClassName(status)}`}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <WeekCalendar
            weekStart={weekStart}
            reservations={reservations}
            showRoomNames={roomFilter === null}
            getReservationHref={getReservationHref}
            onSlotClick={isOnline ? handleSlotClick : undefined}
          />
        </>
      )}
    </>
  );
}

export default function CalendarPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="mt-2 text-slate-700">
            Weekly overview of room bookings.
          </p>
        </div>

        {/* useSearchParams needs a Suspense boundary for static rendering. */}
        <Suspense>
          <CalendarContent />
        </Suspense>
      </section>
    </ProtectedRoute>
  );
}
