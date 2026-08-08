"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  getActiveEmployees,
  getActiveReservations,
  getActiveRooms,
} from "@/lib/api";
import { QueryState } from "@/components/ui/query-state";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function HomePage() {
  const roomsQuery = useQuery({
    queryKey: ["rooms", "active"],
    queryFn: getActiveRooms,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", "active"],
    queryFn: getActiveEmployees,
  });

  const reservationsQuery = useQuery({
    queryKey: ["reservations", "active"],
    queryFn: getActiveReservations,
  });

  const isLoading =
    roomsQuery.isLoading ||
    employeesQuery.isLoading ||
    reservationsQuery.isLoading;

  const isError =
    roomsQuery.isError || employeesQuery.isError || reservationsQuery.isError;

  const error =
    roomsQuery.error || employeesQuery.error || reservationsQuery.error;

  const rooms = roomsQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const reservations = reservationsQuery.data ?? [];

  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === "PENDING",
  );

  const approvedReservations = reservations.filter(
    (reservation) => reservation.status === "APPROVED",
  );

  /* const cancelledReservations = reservations.filter(
    (reservation) => reservation.status === "CANCELLED",
  );

  const completedReservations = reservations.filter(
    (reservation) => reservation.status === "COMPLETED",
  ); */

  const cards = [
    {
      label: "Active rooms",
      value: rooms.length,
      href: "/rooms",
    },
    {
      label: "Active employees",
      value: employees.length,
      href: "/employees",
    },
    {
      label: "Active reservations",
      value: reservations.length,
      href: "/reservations",
    },
    {
      label: "Pending reservations",
      value: pendingReservations.length,
      href: "/reservations",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <section className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Meeting Room Reservation PWA</h1>
          <p className="max-w-3xl text-slate-700">
            This application uses a Spring Boot backend and PWA technologies to
            provide an installable, app-like reservation system with offline
            access to previously loaded read data.
          </p>
        </div>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          loadingText="Loading dashboard..."
          errorTitle="Failed to load dashboard data."
        />

        {!isLoading && !isError && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </Link>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Reservation status</h2>

                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <dt>Pending</dt>
                    <dd className="font-semibold">
                      {pendingReservations.length}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Approved</dt>
                    <dd className="font-semibold">
                      {approvedReservations.length}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Total active</dt>
                    <dd className="font-semibold">{reservations.length}</dd>
                  </div>
                </dl>
              </article>

              <article className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Offline behavior</h2>

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Rooms, employees, and reservations can be viewed offline after
                  they have been loaded once. Reservation changes are disabled
                  offline because the backend must validate room availability
                  and prevent conflicting bookings.
                </p>

                <div className="mt-5">
                  <Link
                    href="/reservations/new"
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    Create reservation
                  </Link>
                </div>
              </article>
            </div>
          </>
        )}
      </section>
    </ProtectedRoute>
  );
}
