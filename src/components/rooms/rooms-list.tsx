"use client";

import Link from "next/link";
import {
  dangerButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui/form-field";
import type { Room } from "@/lib/types";

type RoomsListProps = {
  rooms: Room[];
  // Admin actions; the buttons are only shown when these are passed.
  onDeactivate?: (room: Room) => void;
  onActivate?: (room: Room) => void;
  actionsDisabled?: boolean;
};

export function RoomsList({
  rooms,
  onDeactivate,
  onActivate,
  actionsDisabled = false,
}: RoomsListProps) {
  if (!rooms.length) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <p className="text-slate-600">No rooms found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <article
          key={room.id}
          className={`rounded-2xl border bg-white p-5 shadow-sm ${
            room.active ? "" : "opacity-75"
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">{room.name}</h2>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                room.active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {room.active ? "Active" : "Inactive"}
            </span>
          </div>

          <dl className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Capacity</dt>
              <dd>{room.capacity}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Location</dt>
              <dd>{room.location}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Projector</dt>
              <dd>{room.hasProjector ? "Yes" : "No"}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/rooms/${room.id}`}
              className="inline-flex rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              View details
            </Link>

            {onDeactivate && onActivate && (
              <>
                <Link
                  href={`/rooms/${room.id}/edit`}
                  className="inline-flex rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Edit
                </Link>

                {room.active ? (
                  <button
                    disabled={actionsDisabled}
                    onClick={() => onDeactivate(room)}
                    className={dangerButtonClassName}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    disabled={actionsDisabled}
                    onClick={() => onActivate(room)}
                    className={secondaryButtonClassName}
                  >
                    Activate
                  </button>
                )}
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
