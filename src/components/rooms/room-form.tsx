"use client";

import { FormEvent, useState } from "react";
import { Alert } from "@/components/ui/alert";
import {
  errorAttributes,
  FormField,
  inputClassName,
  primaryButtonClassName,
} from "@/components/ui/form-field";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { SaveRoomInput } from "@/lib/types";

const NAME_MAX_LENGTH = 255;
const LOCATION_MAX_LENGTH = 255;

type RoomFormProps = {
  initialValues?: SaveRoomInput;
  submitLabel: string;
  onSubmit: (values: SaveRoomInput) => void;
  isSubmitting: boolean;
  submitError: string | null;
  serverFieldErrors?: Record<string, string>;
};

type RoomFormErrors = Partial<Record<keyof SaveRoomInput, string>>;

export function RoomForm({
  initialValues,
  submitLabel,
  onSubmit,
  isSubmitting,
  submitError,
  serverFieldErrors,
}: RoomFormProps) {
  const isOnline = useOnlineStatus();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [capacity, setCapacity] = useState(initialValues?.capacity ?? 1);
  const [hasProjector, setHasProjector] = useState(
    initialValues?.hasProjector ?? false,
  );
  const [errors, setErrors] = useState<RoomFormErrors>({});

  function errorFor(field: keyof SaveRoomInput) {
    return errors[field] ?? serverFieldErrors?.[field];
  }

  function validate(): RoomFormErrors {
    const nextErrors: RoomFormErrors = {};

    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!location.trim()) nextErrors.location = "Location is required.";

    if (!Number.isInteger(capacity) || capacity < 1) {
      nextErrors.capacity = "Capacity must be a whole number of at least 1.";
    }

    return nextErrors;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      name: name.trim(),
      location: location.trim(),
      capacity,
      hasProjector,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="name" label="Name" error={errorFor("name")}>
          <input
            {...errorAttributes("name", errorFor("name"))}
            value={name}
            maxLength={NAME_MAX_LENGTH}
            onChange={(e) => setName(e.target.value)}
            className={inputClassName}
            placeholder="Conference Room"
          />
        </FormField>

        <FormField id="location" label="Location" error={errorFor("location")}>
          <input
            {...errorAttributes("location", errorFor("location"))}
            value={location}
            maxLength={LOCATION_MAX_LENGTH}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClassName}
            placeholder="2nd floor, east wing"
          />
        </FormField>

        <FormField id="capacity" label="Capacity" error={errorFor("capacity")}>
          <input
            {...errorAttributes("capacity", errorFor("capacity"))}
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className={inputClassName}
          />
        </FormField>

        <div className="flex items-center gap-3 md:mt-8">
          <input
            id="hasProjector"
            type="checkbox"
            checked={hasProjector}
            onChange={(e) => setHasProjector(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label
            htmlFor="hasProjector"
            className="text-sm font-medium text-slate-700"
          >
            Has projector
          </label>
        </div>
      </div>

      {!isOnline && (
        <Alert variant="warning">
          You are offline. Saving rooms requires an internet connection.
        </Alert>
      )}

      {submitError && <Alert variant="error">{submitError}</Alert>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !isOnline}
          className={primaryButtonClassName}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
