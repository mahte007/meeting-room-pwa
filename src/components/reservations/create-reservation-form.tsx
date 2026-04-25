"use client";

import { useMemo, useState } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { CreateReservationInput, Employee, Room } from "@/lib/types";

type CreateReservationFormProps = {
  rooms: Room[];
  employees: Employee[];
  initialValues?: Partial<CreateReservationInput>;
  submitLabel?: string;
  onSubmit: (values: CreateReservationInput) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
};

type FormErrors = Partial<Record<keyof CreateReservationInput | "form", string>>;

function toLocalDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function withSeconds(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

export function CreateReservationForm({
  rooms,
  employees,
  initialValues,
  submitLabel = "Create reservation",
  onSubmit,
  isSubmitting,
  submitError,
}: CreateReservationFormProps) {
  const isOnline = useOnlineStatus();

  const initialStart = useMemo(() => {
    if (initialValues?.startTime) return initialValues.startTime.slice(0, 16);

    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return toLocalDateTimeInputValue(now);
  }, [initialValues?.startTime]);

  const initialEnd = useMemo(() => {
    if (initialValues?.endTime) return initialValues.endTime.slice(0, 16);

    const later = new Date();
    later.setMinutes(0, 0, 0);
    later.setHours(later.getHours() + 2);
    return toLocalDateTimeInputValue(later);
  }, [initialValues?.endTime]);

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [attendeeCount, setAttendeeCount] = useState(
    initialValues?.attendeeCount ?? 1
  );
  const [employeeId, setEmployeeId] = useState<number | "">(
    initialValues?.employeeId ?? ""
  );
  const [roomId, setRoomId] = useState<number | "">(
    initialValues?.roomId ?? ""
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const selectedRoom =
    roomId === "" ? undefined : rooms.find((room) => room.id === roomId);

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

    if (employeeId === "") {
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
      employeeId: employeeId as number,
      roomId: roomId as number,
    });
  }

  const isDisabled = isSubmitting || !isOnline;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
            placeholder="Weekly team sync"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
            placeholder="Optional reservation notes"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Start time
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          />
          {errors.startTime && (
            <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            End time
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          />
          {errors.endTime && (
            <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Attendee count
          </label>
          <input
            type="number"
            min={1}
            value={attendeeCount}
            onChange={(e) => setAttendeeCount(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          />
          {errors.attendeeCount && (
            <p className="mt-1 text-sm text-red-600">
              {errors.attendeeCount}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Employee
          </label>
          <select
            value={employeeId}
            onChange={(e) =>
              setEmployeeId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} — {employee.department}
              </option>
            ))}
          </select>
          {errors.employeeId && (
            <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Room
          </label>
          <select
            value={roomId}
            onChange={(e) =>
              setRoomId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          >
            <option value="">Select room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} — {room.location} — capacity {room.capacity}
              </option>
            ))}
          </select>
          {errors.roomId && (
            <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>
          )}
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
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