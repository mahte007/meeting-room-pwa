"use client";

import { useQuery } from "@tanstack/react-query";
import { EmployeesList } from "@/components/employees/employees-list";
import { QueryState } from "@/components/ui/query-state";
import { getActiveEmployees } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function EmployeesPage() {
  const {
    data: employees = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employees", "active"],
    queryFn: getActiveEmployees,
  });

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="mt-2 text-slate-700">
            View active employees from the Spring Boot backend.
          </p>
        </div>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          loadingText="Loading employees..."
          errorTitle="Failed to load employees."
        />

        {!isLoading && !isError && <EmployeesList employees={employees} />}
      </section>
    </ProtectedRoute>
  );
}
