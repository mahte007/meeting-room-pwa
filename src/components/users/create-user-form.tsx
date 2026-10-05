"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import {
  errorAttributes,
  FormField,
  inputClassName,
  primaryButtonClassName,
} from "@/components/ui/form-field";
import { RoleAndEmployeeFields } from "@/components/users/account-fields";
import { createUser, getErrorDetails } from "@/lib/api";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  type CreateUserInput,
  type Employee,
  type User,
  type UserRole,
} from "@/lib/types";

type CreateUserFormProps = {
  linkableEmployees: Employee[];
  disabled: boolean;
  onCreated: (user: User) => void;
};

type CreateUserErrors = Partial<Record<keyof CreateUserInput, string>>;

export function CreateUserForm({
  linkableEmployees,
  disabled,
  onCreated,
}: CreateUserFormProps) {
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("EMPLOYEE");
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [errors, setErrors] = useState<CreateUserErrors>({});

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setUsername("");
      setPassword("");
      setRole("EMPLOYEE");
      setEmployeeId("");
      onCreated(user);
    },
  });

  const submitErrorDetails = mutation.isError
    ? getErrorDetails(mutation.error, "Failed to create login.")
    : null;

  function errorFor(field: keyof CreateUserInput) {
    return errors[field] ?? submitErrorDetails?.fields[field];
  }

  function validate(): CreateUserErrors {
    const nextErrors: CreateUserErrors = {};
    const trimmed = username.trim();

    if (
      trimmed.length < USERNAME_MIN_LENGTH ||
      trimmed.length > USERNAME_MAX_LENGTH
    ) {
      nextErrors.username = `Username must be ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters.`;
    }

    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      nextErrors.password = `Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`;
    }

    if (role === "EMPLOYEE" && employeeId === "") {
      nextErrors.employeeId = "Employee accounts must be linked to an employee.";
    }

    return nextErrors;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate({
      username: username.trim(),
      password,
      role,
      employeeId: employeeId === "" ? null : employeeId,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold">Create login</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="new-username" label="Username" error={errorFor("username")}>
          <input
            {...errorAttributes("new-username", errorFor("username"))}
            autoComplete="off"
            maxLength={USERNAME_MAX_LENGTH}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClassName}
          />
        </FormField>

        <FormField
          id="new-password"
          label="Initial password"
          error={errorFor("password")}
        >
          <input
            {...errorAttributes("new-password", errorFor("password"))}
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
          />
        </FormField>

        <RoleAndEmployeeFields
          idPrefix="new"
          role={role}
          employeeId={employeeId}
          employees={linkableEmployees}
          onRoleChange={setRole}
          onEmployeeChange={setEmployeeId}
          roleError={errorFor("role")}
          employeeError={errorFor("employeeId")}
        />
      </div>

      {submitErrorDetails && (
        <Alert variant="error">{submitErrorDetails.message}</Alert>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || mutation.isPending}
          className={primaryButtonClassName}
        >
          {mutation.isPending ? "Creating..." : "Create login"}
        </button>
      </div>
    </form>
  );
}
