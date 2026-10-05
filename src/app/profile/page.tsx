"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Alert } from "@/components/ui/alert";
import {
  errorAttributes,
  FormField,
  inputClassName,
  primaryButtonClassName,
} from "@/components/ui/form-field";
import { useAuth } from "@/contexts/auth-context";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { changePassword, getErrorDetails } from "@/lib/api";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type ChangePasswordInput,
} from "@/lib/types";

type PasswordFormErrors = Partial<
  Record<keyof ChangePasswordInput | "confirmPassword", string>
>;

function ChangePasswordForm() {
  const isOnline = useOnlineStatus();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordFormErrors>({});

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
  });

  const submitErrorDetails = mutation.isError
    ? getErrorDetails(mutation.error, "Failed to change password.")
    : null;

  function errorFor(field: keyof PasswordFormErrors) {
    return (
      errors[field] ??
      (field === "confirmPassword"
        ? undefined
        : submitErrorDetails?.fields[field])
    );
  }

  function validate(): PasswordFormErrors {
    const nextErrors: PasswordFormErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = "Current password is required.";
    }

    if (
      newPassword.length < PASSWORD_MIN_LENGTH ||
      newPassword.length > PASSWORD_MAX_LENGTH
    ) {
      nextErrors.newPassword = `Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`;
    }

    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate({ currentPassword, newPassword });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold">Change password</h2>

      <FormField
        id="currentPassword"
        label="Current password"
        error={errorFor("currentPassword")}
      >
        <input
          {...errorAttributes("currentPassword", errorFor("currentPassword"))}
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClassName}
        />
      </FormField>

      <FormField
        id="newPassword"
        label="New password"
        error={errorFor("newPassword")}
      >
        <input
          {...errorAttributes("newPassword", errorFor("newPassword"))}
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClassName}
        />
      </FormField>

      <FormField
        id="confirmPassword"
        label="Confirm new password"
        error={errorFor("confirmPassword")}
      >
        <input
          {...errorAttributes("confirmPassword", errorFor("confirmPassword"))}
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClassName}
        />
      </FormField>

      {mutation.isSuccess && (
        <Alert variant="success">Your password has been changed.</Alert>
      )}

      {submitErrorDetails && (
        <Alert variant="error">{submitErrorDetails.message}</Alert>
      )}

      {!isOnline && (
        <Alert variant="warning">
          You are offline. Changing your password requires an internet
          connection.
        </Alert>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending || !isOnline}
          className={primaryButtonClassName}
        >
          {mutation.isPending ? "Saving..." : "Change password"}
        </button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]}>
      <section className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-2 text-slate-700">
            Your account details and password.
          </p>
        </div>

        <article className="rounded-2xl border bg-white p-6 shadow-sm">
          <dl className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="font-medium">Username</dt>
              <dd className="mt-1 text-lg font-semibold">{user?.username}</dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="font-medium">Role</dt>
              <dd className="mt-1 text-lg font-semibold">{user?.role}</dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="font-medium">Employee</dt>
              <dd className="mt-1 text-lg font-semibold">
                {user?.employeeName ?? "Not linked"}
              </dd>
            </div>
          </dl>
        </article>

        <ChangePasswordForm />
      </section>
    </ProtectedRoute>
  );
}
