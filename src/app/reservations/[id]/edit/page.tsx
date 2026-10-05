"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateReservationForm } from "@/components/reservations/create-reservation-form";
import { QueryState } from "@/components/ui/query-state";
import {
  getActiveEmployees,
  getActiveRooms,
  getErrorDetails,
  getReservation,
  updateReservation,
} from "@/lib/api";
import {
  FINAL_STATUSES,
  type CreateReservationInput,
  type Reservation,
} from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";

/**
 * Returns why the reservation can't be edited, mirroring the backend rules,
 * or null if it can be.
 */
function getEditBlockReason(
  reservation: Reservation,
  isAdmin: boolean,
  employeeId: number | null | undefined,
) {
  if (!isAdmin && reservation.employeeId !== employeeId) {
    return "You can only modify your own reservations.";
  }

  if (reservation.archived) {
    return "Archived reservations cannot be modified.";
  }

  if (FINAL_STATUSES.includes(reservation.status)) {
    return "Cancelled or completed reservations cannot be modified.";
  }

  return null;
}

export default function EditReservationPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const isValidId = Number.isInteger(id) && id > 0;

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const router = useRouter();
  const queryClient = useQueryClient();

  const reservationQuery = useQuery({
    queryKey: ["reservations", id],
    queryFn: () => getReservation(id),
    enabled: isValidId,
  });

  const roomsQuery = useQuery({
    queryKey: ["rooms", "active"],
    queryFn: getActiveRooms,
  });

  // /api/employees is admin-only; only admins can reassign a reservation.
  const employeesQuery = useQuery({
    queryKey: ["employees", "active"],
    queryFn: getActiveEmployees,
    enabled: isAdmin,
  });

  const mutation = useMutation({
    mutationFn: (values: CreateReservationInput) =>
      updateReservation(id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reservations"] }),
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
      ]);

      router.push("/reservations?success=updated");
    },
  });

  const submitErrorDetails = mutation.isError
    ? getErrorDetails(mutation.error, "Failed to update reservation.")
    : null;

  const isLoading =
    reservationQuery.isLoading ||
    roomsQuery.isLoading ||
    (isAdmin && employeesQuery.isLoading);

  const isError =
    reservationQuery.isError ||
    roomsQuery.isError ||
    (isAdmin && employeesQuery.isError);

  const combinedError =
    reservationQuery.error || roomsQuery.error || employeesQuery.error;

  const initialValues = useMemo(() => {
    const reservation = reservationQuery.data;

    if (!reservation) {
      return undefined;
    }

    return {
      title: reservation.title,
      description: reservation.description ?? "",
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      attendeeCount: reservation.attendeeCount,
      employeeId: reservation.employeeId,
      roomId: reservation.roomId,
    };
  }, [reservationQuery.data]);

  const editBlockReason = reservationQuery.data
    ? getEditBlockReason(reservationQuery.data, isAdmin, user?.employeeId)
    : null;

  async function handleSubmit(values: CreateReservationInput) {
    // mutate (not mutateAsync) so a failed request surfaces through
    // mutation.error instead of an unhandled promise rejection.
    mutation.mutate(values);
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Reservation</h1>
          <p className="mt-2 text-slate-700">
            Update reservation data and let the backend validate conflicts.
          </p>
        </div>

        {!isValidId ? (
          <p className="text-slate-700">The reservation id is invalid.</p>
        ) : (
          <>
            <QueryState
              isLoading={isLoading}
              isError={isError}
              error={combinedError}
              loadingText="Loading reservation..."
              errorTitle="Failed to load reservation."
            />

            {!isLoading && !isError && editBlockReason && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm text-amber-800">{editBlockReason}</p>
                <Link
                  href="/reservations"
                  className="mt-3 inline-block text-sm font-medium underline"
                >
                  Back to reservations
                </Link>
              </div>
            )}

            {!isLoading && !isError && !editBlockReason && initialValues && (
              <CreateReservationForm
                rooms={roomsQuery.data ?? []}
                employees={employeesQuery.data ?? []}
                initialValues={initialValues}
                submitLabel="Save changes"
                onSubmit={handleSubmit}
                isSubmitting={mutation.isPending}
                submitError={submitErrorDetails?.message ?? null}
                serverFieldErrors={submitErrorDetails?.fields}
              />
            )}
          </>
        )}
      </section>
    </ProtectedRoute>
  );
}
