"use client";

import { useState } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { CreateReservationInput, Employee, Room } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { roundedHoursFromNow, withSeconds } from "@/lib/date-utils";

type CreateReservationFormProps = {
  rooms: Room[];
  employees: Employee[];
  initialValues?: Partial<CreateReservationInput>;
  submitLabel?: string;
  onSubmit: (values: CreateReservationInput) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  // Per-field messages from a backend VALIDATION_ERROR response.
  serverFieldErrors?: Record<string, string>;
};

type FormErrors = Partial<
  Record<keyof CreateReservationInput | "form", string>
>;

const TITLE_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 1000;

const inputClassName =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

export function CreateReservationForm({
  rooms,
  employees,
  initialValues,
  submitLabel = "Create reservation",
  onSubmit,
  isSubmitting,
  submitError,
  serverFieldErrors,
}: CreateReservationFormProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isOnline = useOnlineStatus();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [startTime, setStartTime] = useState(
    () => initialValues?.startTime?.slice(0, 16) ?? roundedHoursFromNow(1),
  );
  const [endTime, setEndTime] = useState(
    () => initialValues?.endTime?.slice(0, 16) ?? roundedHoursFromNow(2),
  );
  const [attendeeCount, setAttendeeCount] = useState(
    initialValues?.attendeeCount ?? 1,
  );
  const [employeeId, setEmployeeId] = useState<number | "">(
    initialValues?.employeeId ?? "",
  );
  const [roomId, setRoomId] = useState<number | "">(
    initialValues?.roomId ?? "",
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const selectedRoom =
    roomId === "" ? undefined : rooms.find((room) => room.id === roomId);

  // Client-side errors take precedence; backend errors fill the gaps.
  function errorFor(field: keyof CreateReservationInput) {
    return errors[field] ?? serverFieldErrors?.[field];
  }

  function describedBy(field: keyof CreateReservationInput) {
    return errorFor(field) ? `${field}-error` : undefined;
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!title.trim()) {
      nextErrors.title = "Title is required.";
    }

    if (!startTime) {
      nextErrors.startTime = "Start time is required.";
    }

    if (!endTime) {
      nextErrors.endTime = "End time is required.";
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (Number.isNaN(start.getTime())) {
        nextErrors.startTime = "Start time is invalid.";
      }

      if (Number.isNaN(end.getTime())) {
        nextErrors.endTime = "End time is invalid.";
      }

      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (end <= start) {
          nextErrors.endTime = "End time must be after start time.";
        }
      }
    }

    if (!attendeeCount || attendeeCount < 1) {
      nextErrors.attendeeCount = "Attendee count must be at least 1.";
    }

    if (roomId === "") {
      nextErrors.roomId = "Room is required.";
    }

    if (isAdmin && employeeId === "") {
      nextErrors.employeeId = "Employee is required.";
    }

    if (selectedRoom && attendeeCount > selectedRoom.capacity) {
      nextErrors.attendeeCount = `This room only supports ${selectedRoom.capacity} attendees.`;
    }

    if (!isOnline) {
      nextErrors.form =
        "You are offline. Reservation changes require an internet connection.";
    }

    return nextErrors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      startTime: withSeconds(startTime),
      endTime: withSeconds(endTime),
      attendeeCount,
      // The backend ignores employeeId for employees and books for themselves.
      employeeId: isAdmin ? (employeeId as number) : undefined,
      roomId: roomId as number,
    });
  }

  const isDisabled = isSubmitting || !isOnline;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Title
          </label>
          <input
            id="title"
            value={title}
            maxLength={TITLE_MAX_LENGTH}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!errorFor("title")}
            aria-describedby={describedBy("title")}
            className={inputClassName}
            placeholder="Weekly team sync"
          />
          <FieldError id="title-error" message={errorFor("title")} />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!errorFor("description")}
            aria-describedby={describedBy("description")}
            rows={4}
            className={inputClassName}
            placeholder="Optional reservation notes"
          />
          <FieldError
            id="description-error"
            message={errorFor("description")}
          />
        </div>

        <div>
          <label
            htmlFor="startTime"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Start time
          </label>
          <input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            aria-invalid={!!errorFor("startTime")}
            aria-describedby={describedBy("startTime")}
            className={inputClassName}
          />
          <FieldError id="startTime-error" message={errorFor("startTime")} />
        </div>

        <div>
          <label
            htmlFor="endTime"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            End time
          </label>
          <input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            aria-invalid={!!errorFor("endTime")}
            aria-describedby={describedBy("endTime")}
            className={inputClassName}
          />
          <FieldError id="endTime-error" message={errorFor("endTime")} />
        </div>

        <div>
          <label
            htmlFor="attendeeCount"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Attendee count
          </label>
          <input
            id="attendeeCount"
            type="number"
            min={1}
            value={attendeeCount}
            onChange={(e) => setAttendeeCount(Number(e.target.value))}
            aria-invalid={!!errorFor("attendeeCount")}
            aria-describedby={describedBy("attendeeCount")}
            className={inputClassName}
          />
          <FieldError
            id="attendeeCount-error"
            message={errorFor("attendeeCount")}
          />
        </div>

        {isAdmin && (
          <div>
            <label
              htmlFor="employeeId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Employee
            </label>
            <select
              id="employeeId"
              value={employeeId}
              onChange={(e) =>
                setEmployeeId(e.target.value ? Number(e.target.value) : "")
              }
              aria-invalid={!!errorFor("employeeId")}
              aria-describedby={describedBy("employeeId")}
              className={inputClassName}
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} — {employee.department}
                </option>
              ))}
            </select>
            <FieldError
              id="employeeId-error"
              message={errorFor("employeeId")}
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label
            htmlFor="roomId"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Room
          </label>
          <select
            id="roomId"
            value={roomId}
            onChange={(e) =>
              setRoomId(e.target.value ? Number(e.target.value) : "")
            }
            aria-invalid={!!errorFor("roomId")}
            aria-describedby={describedBy("roomId")}
            className={inputClassName}
          >
            <option value="">Select room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} — {room.location} — capacity {room.capacity}
              </option>
            ))}
          </select>
          <FieldError id="roomId-error" message={errorFor("roomId")} />
        </div>
      </div>

      {!isOnline && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            You are offline. Reservation changes are disabled because the
            backend must validate room availability and conflicts.
          </p>
        </div>
      )}

      {errors.form && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">{errors.form}</p>
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isDisabled}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
