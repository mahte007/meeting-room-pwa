"use client";

import { Suspense, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateReservationForm } from "@/components/reservations/create-reservation-form";
import { QueryState } from "@/components/ui/query-state";
import {
  createReservation,
  getActiveEmployees,
  getActiveRooms,
  getErrorDetails,
} from "@/lib/api";
import type { CreateReservationInput } from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { isValidDateTime } from "@/lib/date-utils";

/**
 * Prefills the form from the URL, e.g. when booking a room found with the
 * availability search: ?roomId=2&start=...&end=...&attendees=4
 */
function readInitialValues(
  searchParams: URLSearchParams,
): Partial<CreateReservationInput> {
  const roomId = Number(searchParams.get("roomId"));
  const attendees = Number(searchParams.get("attendees"));
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  return {
    roomId: Number.isInteger(roomId) && roomId > 0 ? roomId : undefined,
    attendeeCount:
      Number.isInteger(attendees) && attendees > 0 ? attendees : undefined,
    startTime: isValidDateTime(start) ? start! : undefined,
    endTime: isValidDateTime(end) ? end! : undefined,
  };
}

function NewReservationContent() {
  const searchParams = useSearchParams();
  const initialValues = useMemo(
    () => readInitialValues(searchParams),
    [searchParams],
  );

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const router = useRouter();
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: ["rooms", "active"],
    queryFn: getActiveRooms,
  });

  // /api/employees is admin-only; only admins pick whom to book for.
  const employeesQuery = useQuery({
    queryKey: ["employees", "active"],
    queryFn: getActiveEmployees,
    enabled: isAdmin,
  });

  const mutation = useMutation({
    mutationFn: (values: CreateReservationInput) => createReservation(values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reservations"] }),
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
      ]);

      router.push("/reservations?success=created");
    },
  });

  const submitErrorDetails = mutation.isError
    ? getErrorDetails(mutation.error, "Failed to create reservation.")
    : null;

  const isLoading =
    roomsQuery.isLoading || (isAdmin && employeesQuery.isLoading);

  const isError = roomsQuery.isError || (isAdmin && employeesQuery.isError);
  const combinedError = roomsQuery.error || employeesQuery.error;

  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const employees = useMemo(
    () => employeesQuery.data ?? [],
    [employeesQuery.data],
  );

  async function handleSubmit(values: CreateReservationInput) {
    // mutate (not mutateAsync) so a failed request surfaces through
    // mutation.error instead of an unhandled promise rejection.
    mutation.mutate(values);
  }

  return (
    <>
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
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          submitError={submitErrorDetails?.message ?? null}
          serverFieldErrors={submitErrorDetails?.fields}
        />
      )}
    </>
  );
}

export default function NewReservationPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Reservation</h1>
          <p className="mt-2 text-slate-700">
            Create a new reservation using active rooms and employees from the
            backend.
          </p>
        </div>

        {/* useSearchParams needs a Suspense boundary for static rendering. */}
        <Suspense>
          <NewReservationContent />
        </Suspense>
      </section>
    </ProtectedRoute>
  );
}
