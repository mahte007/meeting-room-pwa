"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { QueryState } from "@/components/ui/query-state";
import { ReservationsList } from "@/components/reservations/reservations-list";
import { getReservationsByRoom, getRoom } from "@/lib/api";

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const roomId = Number(params.id);

  const roomQuery = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => getRoom(roomId),
    enabled: Number.isFinite(roomId),
  });

  const reservationsQuery = useQuery({
    queryKey: ["reservations", "room", roomId],
    queryFn: () => getReservationsByRoom(roomId),
    enabled: Number.isFinite(roomId),
  });

  if (!Number.isFinite(roomId)) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">Invalid room</h1>
        <p className="text-slate-700">The room id is invalid.</p>
        <Link href="/rooms" className="text-sm font-medium underline">
          Back to rooms
        </Link>
      </section>
    );
  }

  const isLoading = roomQuery.isLoading || reservationsQuery.isLoading;
  const isError = roomQuery.isError || reservationsQuery.isError;
  const error = roomQuery.error || reservationsQuery.error;

  return (
    <section className="space-y-6">
      <div>
        <Link href="/rooms" className="text-sm font-medium text-slate-600 underline">
          Back to rooms
        </Link>

        <h1 className="mt-3 text-3xl font-bold">
          {roomQuery.data?.name ?? "Room details"}
        </h1>

        <p className="mt-2 text-slate-700">
          View room information and reservations assigned to this room.
        </p>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Loading room details..."
        errorTitle="Failed to load room details."
      />

      {!isLoading && !isError && roomQuery.data && (
        <>
          <article className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{roomQuery.data.name}</h2>
                <p className="text-sm text-slate-500">{roomQuery.data.location}</p>
              </div>

              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  roomQuery.data.active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {roomQuery.data.active ? "Active" : "Inactive"}
              </span>
            </div>

            <dl className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="font-medium">Capacity</dt>
                <dd className="mt-1 text-lg font-semibold">{roomQuery.data.capacity}</dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="font-medium">Projector</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {roomQuery.data.hasProjector ? "Available" : "Not available"}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="font-medium">Room ID</dt>
                <dd className="mt-1 text-lg font-semibold">{roomQuery.data.id}</dd>
              </div>
            </dl>
          </article>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Reservations for this room</h2>
            <ReservationsList reservations={reservationsQuery.data ?? []} />
          </div>
        </>
      )}
    </section>
  );
}