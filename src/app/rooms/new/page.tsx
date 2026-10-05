"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoomForm } from "@/components/rooms/room-form";
import { createRoom, getErrorDetails } from "@/lib/api";

export default function NewRoomPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createRoom,
    onSuccess: async (room) => {
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      router.push(`/rooms/${room.id}`);
    },
  });

  const submitErrorDetails = mutation.isError
    ? getErrorDetails(mutation.error, "Failed to create room.")
    : null;

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <section className="space-y-6">
        <div>
          <Link
            href="/rooms"
            className="text-sm font-medium text-slate-600 underline"
          >
            Back to rooms
          </Link>
          <h1 className="mt-3 text-3xl font-bold">New Room</h1>
          <p className="mt-2 text-slate-700">
            Add a bookable meeting room. Room names must be unique.
          </p>
        </div>

        <RoomForm
          submitLabel="Create room"
          onSubmit={(values) => mutation.mutate(values)}
          isSubmitting={mutation.isPending}
          submitError={submitErrorDetails?.message ?? null}
          serverFieldErrors={submitErrorDetails?.fields}
        />
      </section>
    </ProtectedRoute>
  );
}
