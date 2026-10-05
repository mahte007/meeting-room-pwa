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
import type { SaveEmployeeInput } from "@/lib/types";

const FIELD_MAX_LENGTH = 255;

// Deliberately loose; the backend does the authoritative email validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmployeeFormProps = {
  initialValues?: SaveEmployeeInput;
  submitLabel: string;
  onSubmit: (values: SaveEmployeeInput) => void;
  isSubmitting: boolean;
  submitError: string | null;
  serverFieldErrors?: Record<string, string>;
};

type EmployeeFormErrors = Partial<Record<keyof SaveEmployeeInput, string>>;

export function EmployeeForm({
  initialValues,
  submitLabel,
  onSubmit,
  isSubmitting,
  submitError,
  serverFieldErrors,
}: EmployeeFormProps) {
  const isOnline = useOnlineStatus();

  const [values, setValues] = useState<SaveEmployeeInput>(
    initialValues ?? { name: "", email: "", department: "", role: "" },
  );
  const [errors, setErrors] = useState<EmployeeFormErrors>({});

  function errorFor(field: keyof SaveEmployeeInput) {
    return errors[field] ?? serverFieldErrors?.[field];
  }

  function setField(field: keyof SaveEmployeeInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function validate(): EmployeeFormErrors {
    const nextErrors: EmployeeFormErrors = {};

    if (!values.name.trim()) nextErrors.name = "Name is required.";

    if (!values.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!values.department.trim()) {
      nextErrors.department = "Department is required.";
    }

    if (!values.role.trim()) nextErrors.role = "Job title is required.";

    return nextErrors;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      name: values.name.trim(),
      email: values.email.trim(),
      department: values.department.trim(),
      role: values.role.trim(),
    });
  }

  const fields: {
    field: keyof SaveEmployeeInput;
    label: string;
    type?: string;
    placeholder: string;
  }[] = [
    { field: "name", label: "Name", placeholder: "Anna Kovács" },
    {
      field: "email",
      label: "Email",
      type: "email",
      placeholder: "anna@example.com",
    },
    { field: "department", label: "Department", placeholder: "Engineering" },
    { field: "role", label: "Job title", placeholder: "Developer" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(({ field, label, type, placeholder }) => (
          <FormField
            key={field}
            id={field}
            label={label}
            error={errorFor(field)}
          >
            <input
              {...errorAttributes(field, errorFor(field))}
              type={type ?? "text"}
              value={values[field]}
              maxLength={FIELD_MAX_LENGTH}
              onChange={(e) => setField(field, e.target.value)}
              className={inputClassName}
              placeholder={placeholder}
            />
          </FormField>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        Creating an employee does not create a login. Add one on the Users
        page afterwards.
      </p>

      {!isOnline && (
        <Alert variant="warning">
          You are offline. Saving employees requires an internet connection.
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
