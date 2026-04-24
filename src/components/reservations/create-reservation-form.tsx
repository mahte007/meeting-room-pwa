"use client";

import { useMemo, useState } from "react";
import type { CreateReservationInput, Employee, Room } from "@/lib/types";

type CreateReservationFormProps = {
  rooms: Room[];
  employees: Employee[];
  onSubmit: (values: CreateReservationInput) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
};

function toLocalDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function CreateReservationForm({
  rooms,
  employees,
  onSubmit,
  isSubmitting,
  submitError,
}: CreateReservationFormProps) {
  const initialStart = useMemo(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return toLocalDateTimeInputValue(now);
  }, []);

  const initialEnd = useMemo(() => {
    const later = new Date();
    later.setMinutes(0, 0, 0);
    later.setHours(later.getHours() + 2);
    return toLocalDateTimeInputValue(later);
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [roomId, setRoomId] = useState<number | "">("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!employeeId || !roomId) {
      return;
    }

    await onSubmit({
      title,
      description,
      startTime,
      endTime,
      attendeeCount,
      employeeId,
      roomId,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
            placeholder="Weekly team sync"
          />
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
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            End time
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          />
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
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          />
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
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} — {employee.department}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Room
          </label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
          >
            <option value="">Select room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} — {room.location} — capacity {room.capacity}
              </option>
            ))}
          </select>
        </div>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create reservation"}
        </button>
      </div>
    </form>
  );
}