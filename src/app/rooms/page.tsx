"use client";

import { useQuery } from "@tanstack/react-query";
import { RoomsList } from "@/components/rooms/rooms-list";
import { QueryState } from "@/components/ui/query-state";
import { getActiveRooms } from "@/lib/api";

export default function RoomsPage() {
  const {
    data: rooms = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["rooms", "active"],
    queryFn: getActiveRooms,
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rooms</h1>
        <p className="mt-2 text-slate-700">
          View active meeting rooms from the Spring Boot backend.
        </p>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Loading rooms..."
        errorTitle="Failed to load rooms."
      />

      {!isLoading && !isError && <RoomsList rooms={rooms} />}
    </section>
  );
}