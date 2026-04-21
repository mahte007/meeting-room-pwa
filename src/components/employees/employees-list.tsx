"use client";

import type { Employee } from "@/lib/types";

type EmployeesListProps = {
  employees: Employee[];
};

export function EmployeesList({ employees }: EmployeesListProps) {
  if (!employees.length) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <p className="text-slate-600">No employees found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {employees.map((employee) => (
        <article
          key={employee.id}
          className="rounded-2xl border bg-white p-5 shadow-sm"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{employee.name}</h2>
              <p className="text-sm text-slate-500">{employee.email}</p>
            </div>

            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                employee.active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {employee.active ? "Active" : "Inactive"}
            </span>
          </div>

          <dl className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Department</dt>
              <dd>{employee.department}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Role</dt>
              <dd>{employee.role}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}