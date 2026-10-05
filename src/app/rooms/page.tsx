"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoomsList } from "@/components/rooms/rooms-list";
import { Alert } from "@/components/ui/alert";
import { QueryState } from "@/components/ui/query-state";
import { useAuth } from "@/contexts/auth-context";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  activateRoom,
  deactivateRoom,
  getActiveRooms,
  getErrorDetails,
  getRooms,
} from "@/lib/api";
import type { Room } from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function RoomsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  const [showInactive, setShowInactive] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Admins load every room so they can reactivate inactive ones.
  const {
    data: rooms = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: isAdmin ? ["rooms", "all"] : ["rooms", "active"],
    queryFn: isAdmin ? getRooms : getActiveRooms,
  });

  const visibleRooms = showInactive
    ? rooms
    : rooms.filter((room) => room.active);

  const inactiveCount = rooms.length - rooms.filter((r) => r.active).length;

  const deactivateMutation = useMutation({
    mutationFn: (room: Room) => deactivateRoom(room.id),
    onSuccess: async (_, room) => {
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setActionMessage(`${room.name} was deactivated.`);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (room: Room) => activateRoom(room.id),
    onSuccess: async (_, room) => {
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setActionMessage(`${room.name} was activated.`);
    },
  });

  function startAction() {
    setActionMessage(null);
    deactivateMutation.reset();
    activateMutation.reset();
  }

  function handleDeactivate(room: Room) {
    const confirmed = window.confirm(
      `Deactivate ${room.name}? It can no longer be booked until it is activated again.`,
    );

    if (!confirmed) return;

    startAction();
    deactivateMutation.mutate(room);
  }

  function handleActivate(room: Room) {
    startAction();
    activateMutation.mutate(room);
  }

  const mutationError = deactivateMutation.error || activateMutation.error;
  const isMutating = deactivateMutation.isPending || activateMutation.isPending;

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Rooms</h1>
            <p className="mt-2 text-slate-700">
              {isAdmin
                ? "Manage meeting rooms from the Spring Boot backend."
                : "View active meeting rooms from the Spring Boot backend."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/rooms/available"
              className="rounded-xl border bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              Find a free room
            </Link>

            {isAdmin && isOnline && (
              <Link
                href="/rooms/new"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                New room
              </Link>
            )}
          </div>
        </div>

        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Show inactive rooms ({inactiveCount})
          </label>
        )}

        {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

        {mutationError && (
          <Alert variant="error" title="Action failed.">
            {getErrorDetails(mutationError, "Unknown error").message}
          </Alert>
        )}

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          loadingText="Loading rooms..."
          errorTitle="Failed to load rooms."
        />

        {!isLoading && !isError && (
          <RoomsList
            rooms={visibleRooms}
            onDeactivate={isAdmin ? handleDeactivate : undefined}
            onActivate={isAdmin ? handleActivate : undefined}
            actionsDisabled={isMutating || !isOnline}
          />
        )}
      </section>
    </ProtectedRoute>
  );
}
