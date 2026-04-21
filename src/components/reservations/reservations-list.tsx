"use client";

import type { Reservation } from "@/lib/types";

type ReservationsListProps = {
  reservations: Reservation[];
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function getStatusClasses(status: Reservation["status"]) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "COMPLETED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function ReservationsList({ reservations }: ReservationsListProps) {
  if (!reservations.length) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <p className="text-slate-600">No reservations found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {reservations.map((reservation) => (
        <article
          key={reservation.id}
          className="rounded-2xl border bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{reservation.title}</h2>
              <p className="text-sm text-slate-500">
                {reservation.description || "No description"}
              </p>
            </div>

            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(
                reservation.status
              )}`}
            >
              {reservation.status}
            </span>
          </div>

          <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Room</dt>
              <dd>{reservation.roomName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Employee</dt>
              <dd>{reservation.employeeName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Start</dt>
              <dd>{formatDateTime(reservation.startTime)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">End</dt>
              <dd>{formatDateTime(reservation.endTime)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Attendees</dt>
              <dd>{reservation.attendeeCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Archived</dt>
              <dd>{reservation.archived ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}