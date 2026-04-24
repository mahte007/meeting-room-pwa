"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CreateReservationForm } from "@/components/reservations/create-reservation-form";
import { QueryState } from "@/components/ui/query-state";
import {
  ApiError,
  createReservation,
  getActiveEmployees,
  getActiveRooms,
} from "@/lib/api";
import type { CreateReservationInput } from "@/lib/types";

export default function NewReservationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const roomsQuery = useQuery({
    queryKey: ["rooms", "active"],
    queryFn: getActiveRooms,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", "active"],
    queryFn: getActiveEmployees,
  });

  const mutation = useMutation({
    mutationFn: (values: CreateReservationInput) => createReservation(values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reservations", "active"] }),
        queryClient.invalidateQueries({ queryKey: ["rooms", "active"] }),
      ]);

      router.push("/reservations");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Failed to create reservation.");
    },
  });

  const isLoading = roomsQuery.isLoading || employeesQuery.isLoading;
  const isError = roomsQuery.isError || employeesQuery.isError;
  const combinedError = roomsQuery.error || employeesQuery.error;

  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const employees = useMemo(() => employeesQuery.data ?? [], [employeesQuery.data]);

  async function handleSubmit(values: CreateReservationInput) {
    setSubmitError(null);
    await mutation.mutateAsync(values);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Reservation</h1>
        <p className="mt-2 text-slate-700">
          Create a new reservation using active rooms and employees from the backend.
        </p>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={combinedError}
        loadingText="Loading reservation form data..."
        errorTitle="Failed to load form data."
      />

      {!isLoading && !isError && (
        <CreateReservationForm
          rooms={rooms}
          employees={employees}
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          submitError={submitError}
        />
      )}
    </section>
  );
}