"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { EmployeeForm } from "@/components/employees/employee-form";
import { QueryState } from "@/components/ui/query-state";
import { getEmployee, getErrorDetails, updateEmployee } from "@/lib/api";
import type { SaveEmployeeInput } from "@/lib/types";

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const isValidId = Number.isInteger(id) && id > 0;

  const router = useRouter();
  const queryClient = useQueryClient();

  const employeeQuery = useQuery({
    queryKey: ["employees", id],
    queryFn: () => getEmployee(id),
    enabled: isValidId,
  });

  const mutation = useMutation({
    mutationFn: (values: SaveEmployeeInput) => updateEmployee(id, values),
    onSuccess: async () => {
      // Reservations show the employee's name, so refresh them too.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["employees"] }),
        queryClient.invalidateQueries({ queryKey: ["reservations"] }),
      ]);
      router.push("/employees");
    },
  });

  const submitErrorDetails = mutation.isError
    ? getErrorDetails(mutation.error, "Failed to update employee.")
    : null;

  const employee = employeeQuery.data;

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <section className="space-y-6">
        <div>
          <Link
            href="/employees"
            className="text-sm font-medium text-slate-600 underline"
          >
            Back to employees
          </Link>
          <h1 className="mt-3 text-3xl font-bold">Edit Employee</h1>
        </div>

        {!isValidId ? (
          <p className="text-slate-700">The employee id is invalid.</p>
        ) : (
          <>
            <QueryState
              isLoading={employeeQuery.isLoading}
              isError={employeeQuery.isError}
              error={employeeQuery.error}
              loadingText="Loading employee..."
              errorTitle="Failed to load employee."
            />

            {employee && (
              <EmployeeForm
                initialValues={{
                  name: employee.name,
                  email: employee.email,
                  department: employee.department,
                  role: employee.role,
                }}
                submitLabel="Save changes"
                onSubmit={(values) => mutation.mutate(values)}
                isSubmitting={mutation.isPending}
                submitError={submitErrorDetails?.message ?? null}
                serverFieldErrors={submitErrorDetails?.fields}
              />
            )}
          </>
        )}
      </section>
    </ProtectedRoute>
  );
}
