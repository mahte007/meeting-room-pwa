"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReservationsList } from "@/components/reservations/reservations-list";
import { QueryState } from "@/components/ui/query-state";
import {
  deleteReservation,
  getActiveReservations,
  updateReservationStatus,
} from "@/lib/api";
import type { ReservationStatus } from "@/lib/types";

export default function ReservationsPage() {
  const queryClient = useQueryClient();

  const {
    data: reservations = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["reservations", "active"],
    queryFn: getActiveReservations,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) =>
      updateReservationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });

  function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reservation?"
    );

    if (!confirmed) return;

    deleteMutation.mutate(id);
  }

  function handleStatusChange(id: number, status: ReservationStatus) {
    statusMutation.mutate({ id, status });
  }

  const mutationError = statusMutation.error || deleteMutation.error;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="mt-2 text-slate-700">
            View and manage active reservations from the Spring Boot backend.
          </p>
        </div>

        <Link
          href="/reservations/new"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          New reservation
        </Link>
      </div>

      {mutationError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">Action failed.</p>
          <p className="mt-1 text-sm text-red-600">
            {mutationError instanceof Error
              ? mutationError.message
              : "Unknown error"}
          </p>
        </div>
      )}

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Loading reservations..."
        errorTitle="Failed to load reservations."
      />

      {!isLoading && !isError && (
        <ReservationsList
          reservations={reservations}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          isMutating={statusMutation.isPending || deleteMutation.isPending}
        />
      )}
    </section>
  );
}