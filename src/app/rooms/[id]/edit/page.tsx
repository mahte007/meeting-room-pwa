"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { RoomForm } from "@/components/rooms/room-form";
import { combineQueries, QueryState } from "@/components/ui/query-state";
import { getErrorDetails, getRoom, updateRoom } from "@/lib/api";
import type { SaveRoomInput } from "@/lib/types";

export default function EditRoomPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const isValidId = Number.isInteger(id) && id > 0;

  const router = useRouter();
  const queryClient = useQueryClient();

  const roomQuery = useQuery({
    queryKey: ["rooms", id],
    queryFn: () => getRoom(id),
    enabled: isValidId,
  });

  const mutation = useMutation({
    mutationFn: (values: SaveRoomInput) => updateRoom(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      router.push(`/rooms/${id}`);
    },
  });

  const submitErrorDetails = mutation.isError
    ? getErrorDetails(mutation.error, "Failed to update room.")
    : null;

  const room = roomQuery.data;

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <section className="space-y-6">
        <div>
          <Link
            href={isValidId ? `/rooms/${id}` : "/rooms"}
            className="text-sm font-medium text-slate-600 underline"
          >
            Back to room
          </Link>
          <h1 className="mt-3 text-3xl font-bold">Edit Room</h1>
        </div>

        {!isValidId ? (
          <p className="text-slate-700">The room id is invalid.</p>
        ) : (
          <>
            <QueryState
              state={combineQueries(roomQuery)}
              loadingText="Loading room..."
              errorTitle="Failed to load room."
            />

            {room && (
              <RoomForm
                initialValues={{
                  name: room.name,
                  location: room.location,
                  capacity: room.capacity,
                  hasProjector: room.hasProjector,
                }}
                submitLabel="Save changes"
                onSubmit={(values) => mutation.mutate(values)}
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
