"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReservationsList } from "@/components/reservations/reservations-list";
import { Alert } from "@/components/ui/alert";
import { combineQueries, QueryState } from "@/components/ui/query-state";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAuth } from "@/contexts/auth-context";
import {
  archiveReservation,
  getActiveReservations,
  getAllReservations,
  getReservationsByEmployee,
  restoreReservation,
  updateReservationStatus,
} from "@/lib/api";
import type { AuthUser, Reservation, ReservationStatus } from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { downloadIcs, toIcsFileName } from "@/lib/ics";

type ReservationView = "all" | "mine" | "approval" | "archived";

type ViewConfig = {
  id: ReservationView;
  label: string;
  description: string;
  emptyText: string;
};

const VIEWS: ViewConfig[] = [
  {
    id: "all",
    label: "All",
    description: "Every active reservation.",
    emptyText: "No reservations found.",
  },
  {
    id: "mine",
    label: "My reservations",
    description: "Reservations booked for you.",
    emptyText: "You have no reservations.",
  },
  {
    id: "approval",
    label: "Awaiting approval",
    description: "Planned reservations waiting for an admin to approve or reject.",
    emptyText: "No reservations are waiting for approval.",
  },
  {
    id: "archived",
    label: "Archived",
    description: "Archived reservations. Restoring one makes it active again.",
    emptyText: "No archived reservations.",
  },
];

function getAvailableViews(user: AuthUser | null) {
  const isAdmin = user?.role === "ADMIN";

  return VIEWS.filter((view) => {
    // "Mine" needs a linked employee; admins may not have one.
    if (view.id === "mine") return user?.employeeId != null;
    if (view.id === "approval" || view.id === "archived") return isAdmin;
    return true;
  });
}

function fetchView(
  view: ReservationView,
  employeeId: number | null,
): Promise<Reservation[]> {
  switch (view) {
    case "mine":
      return getReservationsByEmployee(employeeId!);
    case "approval":
      return getActiveReservations().then((reservations) =>
        reservations.filter((r) => r.status === "PLANNED"),
      );
    case "archived":
      return getAllReservations().then((reservations) =>
        reservations.filter((r) => r.archived),
      );
    default:
      return getActiveReservations();
  }
}

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

function ReservationsView({
  view,
  initialMessage,
}: {
  view: ViewConfig;
  initialMessage: string | null;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? null;

  // undefined means no action has happened yet in this view, so the message
  // passed in the URL by the create and edit pages is shown instead.
  const [actionMessage, setActionMessage] = useState<string | null>();

  const successMessage =
    actionMessage === undefined ? initialMessage : actionMessage;

  const reservationsQuery = useQuery({
    queryKey: ["reservations", "view", view.id, employeeId],
    queryFn: () => fetchView(view.id, employeeId),
  });

  const reservations = reservationsQuery.data ?? [];
  const queryState = combineQueries(reservationsQuery);

  // Cancelled reservations no longer take place, so they aren't exported.
  const exportable = reservations.filter(
    (reservation) => !reservation.archived && reservation.status !== "CANCELLED",
  );

  function handleExport() {
    downloadIcs(
      exportable,
      toIcsFileName(`reservations ${view.label}`),
      `Meeting rooms: ${view.label}`,
    );
  }

  async function onMutationSuccess(message: string) {
    await queryClient.invalidateQueries({ queryKey: ["reservations"] });
    setActionMessage(message);
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) =>
      updateReservationStatus(id, status),
    onSuccess: (_, variables) =>
      onMutationSuccess(`Reservation status changed to ${variables.status}.`),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveReservation,
    onSuccess: () => onMutationSuccess("Reservation archived."),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreReservation,
    onSuccess: () => onMutationSuccess("Reservation restored."),
  });

  const mutations = [statusMutation, archiveMutation, restoreMutation];

  function startAction() {
    setActionMessage(null);
    mutations.forEach((mutation) => mutation.reset());
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

  function handleRestore(id: number) {
    startAction();
    restoreMutation.mutate(id);
  }

  const mutationError = mutations.find((mutation) => mutation.error)?.error;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{view.description}</p>

        {view.id !== "archived" && (
          <button
            onClick={handleExport}
            disabled={exportable.length === 0}
            title="Download these reservations as an .ics file for Google Calendar, Outlook or Apple Calendar"
            className="cursor-pointer rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-default disabled:opacity-60"
          >
            Export to calendar
          </button>
        )}
      </div>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {mutationError && (
        <Alert variant="error" title="Action failed.">
          {mutationError instanceof Error
            ? mutationError.message
            : "Unknown error"}
        </Alert>
      )}

      <QueryState
        state={queryState}
        loadingText="Loading reservations..."
        errorTitle="Failed to load reservations."
      />

      {queryState.status === "ready" && (
        <ReservationsList
          reservations={reservations}
          onArchive={handleArchive}
          onStatusChange={handleStatusChange}
          onRestore={handleRestore}
          isMutating={mutations.some((mutation) => mutation.isPending)}
          emptyText={view.emptyText}
        />
      )}
    </>
  );
}

function ReservationsContent() {
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  const availableViews = getAvailableViews(user);
  const requestedView = searchParams.get("view");
  const activeView =
    availableViews.find((view) => view.id === requestedView) ??
    availableViews[0];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="mt-2 text-slate-700">
            View and manage reservations from the Spring Boot backend.
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

      <nav
        aria-label="Reservation views"
        className="flex flex-wrap gap-2 border-b pb-3"
      >
        {availableViews.map((view) => {
          const isActive = view.id === activeView.id;

          return (
            <Link
              key={view.id}
              href={`/reservations?view=${view.id}`}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {view.label}
            </Link>
          );
        })}
      </nav>

      {/* Keyed so switching views starts with fresh messages and mutations. */}
      <ReservationsView
        key={activeView.id}
        view={activeView}
        initialMessage={getSuccessMessage(searchParams.get("success"))}
      />
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
