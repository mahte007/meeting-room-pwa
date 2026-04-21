"use client";

import type { Room } from "@/lib/types";

type RoomsListProps = {
  rooms: Room[];
};

export function RoomsList({ rooms }: RoomsListProps) {
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
          className="rounded-2xl border bg-white p-5 shadow-sm"
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
        </article>
      ))}
    </div>
  );
}