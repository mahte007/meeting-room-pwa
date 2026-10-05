"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReservationsList } from "@/components/reservations/reservations-list";
import { QueryState } from "@/components/ui/query-state";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  archiveReservation,
  getActiveReservations,
  updateReservationStatus,
} from "@/lib/api";
import type { ReservationStatus } from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/protected-route";

function getSuccessMessage(success: string | null) {
  switch (success) {
    case "created":
      return "Reservation created successfully.";
    case "updated":
      return "Reservation updated successfully.";
    default:
      return null;
  }
}

function ReservationsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();

  // undefined means no action has happened yet on this page, so the message
  // passed in the URL by the create and edit pages is shown instead.
  const [actionMessage, setActionMessage] = useState<string | null>();

  const successMessage =
    actionMessage === undefined
      ? getSuccessMessage(searchParams.get("success"))
      : actionMessage;

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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setActionMessage(`Reservation status changed to ${variables.status}.`);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveReservation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setActionMessage("Reservation archived.");
    },
  });

  function startAction() {
    setActionMessage(null);
    statusMutation.reset();
    archiveMutation.reset();
  }

  function handleArchive(id: number) {
    const confirmed = window.confirm(
      "Archive this reservation? It will be removed from the list and its time slot will be freed.",
    );

    if (!confirmed) return;

    startAction();
    archiveMutation.mutate(id);
  }

  function handleStatusChange(id: number, status: ReservationStatus) {
    startAction();
    statusMutation.mutate({ id, status });
  }

  const mutationError = statusMutation.error || archiveMutation.error;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="mt-2 text-slate-700">
            View and manage active reservations from the Spring Boot backend.
          </p>
        </div>

        {isOnline ? (
          <Link
            href="/reservations/new"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            New reservation
          </Link>
        ) : (
          <button
            disabled
            className="rounded-xl bg-slate-300 px-4 py-2 text-sm font-medium text-white"
          >
            New reservation
          </button>
        )}
      </div>

      <div aria-live="polite">
        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}
      </div>

      {mutationError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6"
        >
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
          onArchive={handleArchive}
          onStatusChange={handleStatusChange}
          isMutating={statusMutation.isPending || archiveMutation.isPending}
        />
      )}
    </>
  );
}

export default function ReservationsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <section className="space-y-6">
        {/* useSearchParams needs a Suspense boundary for static rendering. */}
        <Suspense>
          <ReservationsContent />
        </Suspense>
      </section>
    </ProtectedRoute>
  );
}
