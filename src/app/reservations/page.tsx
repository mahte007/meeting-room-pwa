"use client";

import Link from "next/link";
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="mt-2 text-slate-700">
            View active reservations from the Spring Boot backend.
          </p>
        </div>

        <Link
          href="/reservations/new"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          New reservation
        </Link>
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