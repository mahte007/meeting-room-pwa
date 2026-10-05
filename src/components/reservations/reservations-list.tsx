"use client";

import Link from "next/link";
import {
  ALLOWED_TRANSITIONS,
  FINAL_STATUSES,
  type Reservation,
  type ReservationStatus,
} from "@/lib/types";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAuth } from "@/contexts/auth-context";

type ReservationsListProps = {
  reservations: Reservation[];
  onArchive?: (id: number) => void;
  onStatusChange?: (id: number, status: ReservationStatus) => void;
  onRestore?: (id: number) => void;
  isMutating?: boolean;
  emptyText?: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function getStatusClasses(status: ReservationStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";
    case "PLANNED":
      return "bg-amber-100 text-amber-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "COMPLETED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

// Button label for moving a reservation from one status to another.
function getTransitionLabel(from: ReservationStatus, to: ReservationStatus) {
  switch (to) {
    case "APPROVED":
      return "Approve";
    case "CANCELLED":
      return from === "PLANNED" ? "Reject" : "Cancel";
    case "COMPLETED":
      return "Mark completed";
    default:
      return to;
  }
}

export function ReservationsList({
  reservations,
  onArchive,
  onStatusChange,
  onRestore,
  isMutating = false,
  emptyText = "No reservations found.",
}: ReservationsListProps) {
  const isOnline = useOnlineStatus();
  const actionsDisabled = isMutating || !isOnline;

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  if (!reservations.length) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <p className="text-slate-600">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {reservations.map((reservation) => {
        // Employees may only edit or archive their own reservations.
        const canManage =
          isAdmin ||
          (user?.employeeId != null &&
            reservation.employeeId === user.employeeId);

        // Archived reservations can only be restored, and only by admins.
        const isArchived = reservation.archived;

        const canEdit =
          canManage &&
          !isArchived &&
          !FINAL_STATUSES.includes(reservation.status);

        const canArchive = canManage && !isArchived && !!onArchive;

        const canRestore = isAdmin && isArchived && !!onRestore;

        const transitions =
          isAdmin && !isArchived && onStatusChange
            ? ALLOWED_TRANSITIONS[reservation.status]
            : [];

        const hasActions =
          canEdit || canArchive || canRestore || transitions.length > 0;

        return (
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

              <div className="flex gap-2">
                {isArchived && (
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-medium text-white">
                    ARCHIVED
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(
                    reservation.status,
                  )}`}
                >
                  {reservation.status}
                </span>
              </div>
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

            {hasActions && !isOnline && (
              <p className="mt-5 text-sm text-amber-700">
                Actions are disabled while offline.
              </p>
            )}

            {hasActions && (
              <div className="mt-5 flex flex-wrap gap-2">
                {canEdit &&
                  (actionsDisabled ? (
                    <span
                      aria-disabled="true"
                      className="cursor-default rounded-xl border px-3 py-2 text-sm font-medium opacity-60"
                    >
                      Edit
                    </span>
                  ) : (
                    <Link
                      href={`/reservations/${reservation.id}/edit`}
                      className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                  ))}

                {transitions.map((nextStatus) => (
                  <button
                    key={nextStatus}
                    disabled={actionsDisabled}
                    onClick={() => onStatusChange?.(reservation.id, nextStatus)}
                    className="cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-default disabled:opacity-60"
                  >
                    {getTransitionLabel(reservation.status, nextStatus)}
                  </button>
                ))}

                {canRestore && (
                  <button
                    disabled={actionsDisabled}
                    onClick={() => onRestore?.(reservation.id)}
                    className="cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-default disabled:opacity-60"
                  >
                    Restore
                  </button>
                )}

                {canArchive && (
                  <button
                    disabled={actionsDisabled}
                    onClick={() => onArchive?.(reservation.id)}
                    className="cursor-pointer rounded-xl border border-red-700 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-default disabled:opacity-60"
                  >
                    Archive
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
