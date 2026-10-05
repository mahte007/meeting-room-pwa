"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { EmployeeForm } from "@/components/employees/employee-form";
import { createEmployee, getErrorDetails } from "@/lib/api";

export default function NewEmployeePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      router.push("/employees");
    },
  });

  const submitErrorDetails = mutation.isError
    ? getErrorDetails(mutation.error, "Failed to create employee.")
    : null;

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
          <h1 className="mt-3 text-3xl font-bold">New Employee</h1>
        </div>

        <EmployeeForm
          submitLabel="Create employee"
          onSubmit={(values) => mutation.mutate(values)}
          isSubmitting={mutation.isPending}
          submitError={submitErrorDetails?.message ?? null}
          serverFieldErrors={submitErrorDetails?.fields}
        />
      </section>
    </ProtectedRoute>
  );
}
