"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmployeesList } from "@/components/employees/employees-list";
import { Alert } from "@/components/ui/alert";
import { combineQueries, QueryState } from "@/components/ui/query-state";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  activateEmployee,
  deactivateEmployee,
  getEmployees,
  getErrorDetails,
} from "@/lib/api";
import type { Employee } from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function EmployeesPage() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  const [showInactive, setShowInactive] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const employeesQuery = useQuery({
    queryKey: ["employees", "all"],
    queryFn: getEmployees,
  });

  const employees = employeesQuery.data ?? [];
  const queryState = combineQueries(employeesQuery);

  const visibleEmployees = showInactive
    ? employees
    : employees.filter((employee) => employee.active);

  const inactiveCount =
    employees.length - employees.filter((e) => e.active).length;

  async function onMutationSuccess(message: string) {
    // Deactivation also affects logins, so refresh the users list too.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["employees"] }),
      queryClient.invalidateQueries({ queryKey: ["users"] }),
    ]);
    setActionMessage(message);
  }

  const deactivateMutation = useMutation({
    mutationFn: (employee: Employee) => deactivateEmployee(employee.id),
    onSuccess: (_, employee) =>
      onMutationSuccess(`${employee.name} was deactivated.`),
  });

  const activateMutation = useMutation({
    mutationFn: (employee: Employee) => activateEmployee(employee.id),
    onSuccess: (_, employee) =>
      onMutationSuccess(`${employee.name} was activated.`),
  });

  function startAction() {
    setActionMessage(null);
    deactivateMutation.reset();
    activateMutation.reset();
  }

  function handleDeactivate(employee: Employee) {
    const confirmed = window.confirm(
      `Deactivate ${employee.name}? Their login will stop working until they are activated again.`,
    );

    if (!confirmed) return;

    startAction();
    deactivateMutation.mutate(employee);
  }

  function handleActivate(employee: Employee) {
    startAction();
    activateMutation.mutate(employee);
  }

  const mutationError = deactivateMutation.error || activateMutation.error;
  const isMutating = deactivateMutation.isPending || activateMutation.isPending;

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Employees</h1>
            <p className="mt-2 text-slate-700">
              Manage employees from the Spring Boot backend.
            </p>
          </div>

          {isOnline && (
            <Link
              href="/employees/new"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              New employee
            </Link>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Show inactive employees ({inactiveCount})
        </label>

        {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

        {mutationError && (
          <Alert variant="error" title="Action failed.">
            {getErrorDetails(mutationError, "Unknown error").message}
          </Alert>
        )}

        <QueryState
          state={queryState}
          loadingText="Loading employees..."
          errorTitle="Failed to load employees."
        />

        {queryState.status === "ready" && (
          <EmployeesList
            employees={visibleEmployees}
            onDeactivate={handleDeactivate}
            onActivate={handleActivate}
            actionsDisabled={isMutating || !isOnline}
          />
        )}
      </section>
    </ProtectedRoute>
  );
}
