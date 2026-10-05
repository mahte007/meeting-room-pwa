"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import {
  dangerButtonClassName,
  errorAttributes,
  FormField,
  inputClassName,
  secondaryButtonClassName,
} from "@/components/ui/form-field";
import { RoleAndEmployeeFields } from "@/components/users/account-fields";
import {
  deleteUser,
  getErrorDetails,
  resetUserPassword,
  updateUser,
} from "@/lib/api";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type Employee,
  type User,
  type UserRole,
} from "@/lib/types";

type UserRowProps = {
  user: User;
  // The signed-in admin's own account can't be deleted or change role.
  isSelf: boolean;
  linkableEmployees: Employee[];
  disabled: boolean;
  onSuccess: (message: string) => void;
};

type Mode = "view" | "edit" | "password";

export function UserRow({
  user,
  isSelf,
  linkableEmployees,
  disabled,
  onSuccess,
}: UserRowProps) {
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("view");
  const [role, setRole] = useState<UserRole>(user.role);
  const [employeeId, setEmployeeId] = useState<number | "">(
    user.employeeId ?? "",
  );
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function finish(message: string) {
    await queryClient.invalidateQueries({ queryKey: ["users"] });
    setMode("view");
    setPassword("");
    onSuccess(message);
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      updateUser(user.id, {
        role,
        employeeId: employeeId === "" ? null : employeeId,
      }),
    onSuccess: () => finish(`${user.username} was updated.`),
  });

  const passwordMutation = useMutation({
    mutationFn: () => resetUserPassword(user.id, password),
    onSuccess: () => finish(`Password for ${user.username} was reset.`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(user.id),
    onSuccess: () => finish(`${user.username} was deleted.`),
  });

  const mutations = [updateMutation, passwordMutation, deleteMutation];
  const isPending = mutations.some((mutation) => mutation.isPending);
  const mutationError = mutations.find((mutation) => mutation.error)?.error;

  function switchMode(nextMode: Mode) {
    mutations.forEach((mutation) => mutation.reset());
    setValidationError(null);
    setRole(user.role);
    setEmployeeId(user.employeeId ?? "");
    setPassword("");
    setMode(nextMode);
  }

  function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (role === "EMPLOYEE" && employeeId === "") {
      setValidationError("Employee accounts must be linked to an employee.");
      return;
    }

    setValidationError(null);
    updateMutation.mutate();
  }

  function handlePasswordReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      setValidationError(
        `Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`,
      );
      return;
    }

    setValidationError(null);
    passwordMutation.mutate();
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Permanently delete the login ${user.username}? This cannot be undone. The linked employee is kept.`,
    );

    if (!confirmed) return;

    mutations.forEach((mutation) => mutation.reset());
    deleteMutation.mutate();
  }

  const actionsDisabled = disabled || isPending;
  const passwordFieldId = `password-${user.id}`;

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {user.username}
            {isSelf && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                (you)
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500">
            {user.employeeName ?? "No linked employee"}
          </p>
        </div>

        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            user.role === "ADMIN"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {user.role}
        </span>
      </div>

      {mode === "edit" && (
        <form onSubmit={handleUpdate} noValidate className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RoleAndEmployeeFields
              idPrefix={`user-${user.id}`}
              role={role}
              employeeId={employeeId}
              employees={linkableEmployees}
              onRoleChange={setRole}
              onEmployeeChange={setEmployeeId}
              roleDisabled={isSelf}
              employeeError={validationError ?? undefined}
            />
          </div>

          {isSelf && (
            <p className="text-sm text-slate-500">
              You cannot change your own role.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={actionsDisabled}
              className={secondaryButtonClassName}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("view")}
              className={secondaryButtonClassName}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "password" && (
        <form
          onSubmit={handlePasswordReset}
          noValidate
          className="mt-4 space-y-4"
        >
          <FormField
            id={passwordFieldId}
            label="New password"
            error={validationError ?? undefined}
          >
            <input
              {...errorAttributes(passwordFieldId, validationError ?? undefined)}
              type="password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName}
            />
          </FormField>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={actionsDisabled}
              className={secondaryButtonClassName}
            >
              {passwordMutation.isPending ? "Saving..." : "Set password"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("view")}
              className={secondaryButtonClassName}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mutationError && (
        <div className="mt-4">
          <Alert variant="error">
            {getErrorDetails(mutationError, "Action failed.").message}
          </Alert>
        </div>
      )}

      {mode === "view" && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            disabled={actionsDisabled}
            onClick={() => switchMode("edit")}
            className={secondaryButtonClassName}
          >
            Change role / employee
          </button>
          <button
            disabled={actionsDisabled}
            onClick={() => switchMode("password")}
            className={secondaryButtonClassName}
          >
            Reset password
          </button>
          <button
            disabled={actionsDisabled || isSelf}
            title={isSelf ? "You cannot delete your own account." : undefined}
            onClick={handleDelete}
            className={dangerButtonClassName}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}
    </article>
  );
}
