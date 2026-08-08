"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateReservationForm } from "@/components/reservations/create-reservation-form";
import { QueryState } from "@/components/ui/query-state";
import {
  ApiError,
  getActiveEmployees,
  getActiveRooms,
  getReservation,
  updateReservation,
} from "@/lib/api";
import type { CreateReservationInput } from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function EditReservationPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reservationQuery = useQuery({
    queryKey: ["reservations", id],
    queryFn: () => getReservation(id),
    enabled: Number.isFinite(id),
  });

  const roomsQuery = useQuery({
    queryKey: ["rooms", "active"],
    queryFn: getActiveRooms,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", "active"],
    queryFn: getActiveEmployees,
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
    onError: (error) => {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Failed to update reservation.");
    },
  });

  const isLoading =
    reservationQuery.isLoading ||
    roomsQuery.isLoading ||
    employeesQuery.isLoading;

  const isError =
    reservationQuery.isError || roomsQuery.isError || employeesQuery.isError;

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

  async function handleSubmit(values: CreateReservationInput) {
    setSubmitError(null);
    await mutation.mutateAsync(values);
  }

  if (!Number.isFinite(id)) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">Invalid reservation</h1>
        <p className="text-slate-700">The reservation id is invalid.</p>
      </section>
    );
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

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={combinedError}
          loadingText="Loading reservation..."
          errorTitle="Failed to load reservation."
        />

        {!isLoading && !isError && initialValues && (
          <CreateReservationForm
            rooms={roomsQuery.data ?? []}
            employees={employeesQuery.data ?? []}
            initialValues={initialValues}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            isSubmitting={mutation.isPending}
            submitError={submitError}
          />
        )}
      </section>
    </ProtectedRoute>
  );
}
