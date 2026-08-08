"use client";

import type { Reservation } from "@/lib/types";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAuth } from "@/contexts/auth-context";

type ReservationsListProps = {
  reservations: Reservation[];
  onDelete?: (id: number) => void;
  onStatusChange?: (id: number, status: Reservation["status"]) => void;
  isMutating?: boolean;
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

export function ReservationsList({
  reservations,
  onDelete,
  onStatusChange,
  isMutating = false,
}: ReservationsListProps) {
  const isOnline = useOnlineStatus();
  const actionsDisabled = isMutating || !isOnline;

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

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
                reservation.status,
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
          </dl>

          {!isOnline && (
            <p className="mt-5 text-sm text-amber-700">
              Actions are disabled while offline.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`/reservations/${reservation.id}/edit`}
              className={`rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50 ${actionsDisabled && "opacity-60 cursor-default pointer-events-none"}`}
            >
              Edit
            </a>

            {isAdmin && reservation.status !== "APPROVED" && (
              <button
                disabled={actionsDisabled}
                onClick={() => onStatusChange?.(reservation.id, "APPROVED")}
                className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
              >
                Approve
              </button>
            )}

            {isAdmin && reservation.status !== "CANCELLED" && (
              <button
                disabled={actionsDisabled}
                onClick={() => onStatusChange?.(reservation.id, "CANCELLED")}
                className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
            )}

            {isAdmin && reservation.status !== "COMPLETED" && (
              <button
                disabled={actionsDisabled}
                onClick={() => onStatusChange?.(reservation.id, "COMPLETED")}
                className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
              >
                Complete
              </button>
            )}

            <button
              disabled={actionsDisabled}
              onClick={() => onDelete?.(reservation.id)}
              className="rounded-xl border border-red-700 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
