"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Alert } from "@/components/ui/alert";
import {
  errorAttributes,
  FormField,
  inputClassName,
  primaryButtonClassName,
} from "@/components/ui/form-field";
import { QueryState } from "@/components/ui/query-state";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getAvailableRooms } from "@/lib/api";
import {
  isValidDateTime,
  roundedHoursFromNow,
  withSeconds,
} from "@/lib/date-utils";

type SearchCriteria = {
  start: string;
  end: string;
  attendees: number;
  projector: boolean;
};

type SearchErrors = Partial<Record<"start" | "end" | "attendees", string>>;

// Reads a complete, valid search from the URL, or null if there isn't one.
function readCriteria(searchParams: URLSearchParams): SearchCriteria | null {
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const attendees = Number(searchParams.get("attendees") ?? "1");

  if (!isValidDateTime(start) || !isValidDateTime(end)) return null;
  if (new Date(start!) >= new Date(end!)) return null;

  return {
    start: start!,
    end: end!,
    attendees: Number.isInteger(attendees) && attendees > 0 ? attendees : 1,
    projector: searchParams.get("projector") === "1",
  };
}

function validate(values: SearchCriteria): SearchErrors {
  const errors: SearchErrors = {};

  if (!isValidDateTime(values.start)) errors.start = "Start time is required.";
  if (!isValidDateTime(values.end)) errors.end = "End time is required.";

  if (!errors.start && !errors.end) {
    if (new Date(values.end) <= new Date(values.start)) {
      errors.end = "End time must be after start time.";
    } else if (new Date(values.start) < new Date()) {
      errors.start = "Start time cannot be in the past.";
    }
  }

  if (!Number.isInteger(values.attendees) || values.attendees < 1) {
    errors.attendees = "Attendee count must be at least 1.";
  }

  return errors;
}

function formatRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${startDate.toLocaleString()} – ${
    startDate.toDateString() === endDate.toDateString()
      ? endDate.toLocaleTimeString()
      : endDate.toLocaleString()
  }`;
}

function AvailabilitySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();

  const criteria = readCriteria(searchParams);

  const [values, setValues] = useState<SearchCriteria>(
    () =>
      criteria ?? {
        start: roundedHoursFromNow(1),
        end: roundedHoursFromNow(2),
        attendees: 1,
        projector: false,
      },
  );
  const [errors, setErrors] = useState<SearchErrors>({});

  const roomsQuery = useQuery({
    queryKey: ["rooms", "available", criteria?.start, criteria?.end],
    queryFn: () =>
      getAvailableRooms(withSeconds(criteria!.start), withSeconds(criteria!.end)),
    enabled: !!criteria,
  });

  // The backend ignores capacity and equipment, so filter here.
  const matchingRooms = (roomsQuery.data ?? []).filter(
    (room) =>
      room.capacity >= (criteria?.attendees ?? 1) &&
      (!criteria?.projector || room.hasProjector),
  );

  const freeButUnsuitable =
    (roomsQuery.data?.length ?? 0) - matchingRooms.length;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const params = new URLSearchParams({
      start: values.start,
      end: values.end,
      attendees: String(values.attendees),
    });

    if (values.projector) params.set("projector", "1");

    router.replace(`/rooms/available?${params}`);
  }

  function bookingHref(roomId: number) {
    const params = new URLSearchParams({
      roomId: String(roomId),
      start: criteria!.start,
      end: criteria!.end,
      attendees: String(criteria!.attendees),
    });

    return `/reservations/new?${params}`;
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="start" label="From" error={errors.start}>
            <input
              {...errorAttributes("start", errors.start)}
              type="datetime-local"
              value={values.start}
              onChange={(e) => setValues({ ...values, start: e.target.value })}
              className={inputClassName}
            />
          </FormField>

          <FormField id="end" label="To" error={errors.end}>
            <input
              {...errorAttributes("end", errors.end)}
              type="datetime-local"
              value={values.end}
              onChange={(e) => setValues({ ...values, end: e.target.value })}
              className={inputClassName}
            />
          </FormField>

          <FormField id="attendees" label="Attendees" error={errors.attendees}>
            <input
              {...errorAttributes("attendees", errors.attendees)}
              type="number"
              min={1}
              value={values.attendees}
              onChange={(e) =>
                setValues({ ...values, attendees: Number(e.target.value) })
              }
              className={inputClassName}
            />
          </FormField>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={values.projector}
              onChange={(e) =>
                setValues({ ...values, projector: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Needs a projector
          </label>

          <button
            type="submit"
            disabled={!isOnline}
            className={primaryButtonClassName}
          >
            Search
          </button>
        </div>

        {!isOnline && (
          <Alert variant="warning">
            You are offline. Availability has to be checked with the server.
          </Alert>
        )}
      </form>

      {criteria && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Free rooms for {formatRange(criteria.start, criteria.end)}
          </h2>

          <QueryState
            isLoading={roomsQuery.isLoading}
            isError={roomsQuery.isError}
            error={roomsQuery.error}
            loadingText="Checking availability..."
            errorTitle="Failed to check availability."
          />

          {roomsQuery.isSuccess && matchingRooms.length === 0 && (
            <div className="rounded-2xl border bg-white p-6">
              <p className="text-slate-600">
                No free room matches this search.
                {freeButUnsuitable > 0 &&
                  ` ${freeButUnsuitable} free room(s) are too small or lack a projector.`}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchingRooms.map((room) => (
              <article
                key={room.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold">{room.name}</h3>
                <p className="text-sm text-slate-500">{room.location}</p>

                <dl className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium">Capacity</dt>
                    <dd>{room.capacity}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium">Projector</dt>
                    <dd>{room.hasProjector ? "Yes" : "No"}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={bookingHref(room.id)}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Book
                  </Link>
                  <Link
                    href={`/rooms/${room.id}`}
                    className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50"
                  >
                    Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function AvailableRoomsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Find a free room</h1>
          <p className="mt-2 text-slate-700">
            Search for rooms that are free for the whole time range, then book
            one directly.
          </p>
        </div>

        {/* useSearchParams needs a Suspense boundary for static rendering. */}
        <Suspense>
          <AvailabilitySearch />
        </Suspense>
      </section>
    </ProtectedRoute>
  );
}
