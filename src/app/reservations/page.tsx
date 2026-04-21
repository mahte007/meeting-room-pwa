"use client";

import { useQuery } from "@tanstack/react-query";
import { ReservationsList } from "@/components/reservations/reservations-list";
import { QueryState } from "@/components/ui/query-state";
import { getActiveReservations } from "@/lib/api";

export default function ReservationsPage() {
  const {
    data: reservations = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["reservations", "active"],
    queryFn: getActiveReservations,
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reservations</h1>
        <p className="mt-2 text-slate-700">
          View active reservations from the Spring Boot backend.
        </p>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Loading reservations..."
        errorTitle="Failed to load reservations."
      />

      {!isLoading && !isError && (
        <ReservationsList reservations={reservations} />
      )}
    </section>
  );
}