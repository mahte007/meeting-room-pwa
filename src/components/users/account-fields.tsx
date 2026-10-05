"use client";

import {
  errorAttributes,
  FormField,
  inputClassName,
} from "@/components/ui/form-field";
import type { Employee, User, UserRole } from "@/lib/types";

/**
 * Active employees that `user` may be linked to: everyone without an account,
 * plus the employee `user` is already linked to.
 */
export function getLinkableEmployees(
  employees: Employee[],
  users: User[],
  user?: User,
) {
  const linkedIds = new Set(
    users
      .filter((u) => u.id !== user?.id && u.employeeId != null)
      .map((u) => u.employeeId),
  );

  return employees.filter((employee) => !linkedIds.has(employee.id));
}

type RoleAndEmployeeFieldsProps = {
  idPrefix: string;
  role: UserRole;
  employeeId: number | "";
  employees: Employee[];
  onRoleChange: (role: UserRole) => void;
  onEmployeeChange: (employeeId: number | "") => void;
  roleDisabled?: boolean;
  roleError?: string;
  employeeError?: string;
};

export function RoleAndEmployeeFields({
  idPrefix,
  role,
  employeeId,
  employees,
  onRoleChange,
  onEmployeeChange,
  roleDisabled = false,
  roleError,
  employeeError,
}: RoleAndEmployeeFieldsProps) {
  const roleId = `${idPrefix}-role`;
  const employeeFieldId = `${idPrefix}-employeeId`;

  return (
    <>
      <FormField id={roleId} label="Role" error={roleError}>
        <select
          {...errorAttributes(roleId, roleError)}
          value={role}
          disabled={roleDisabled}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          className={inputClassName}
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Admin</option>
        </select>
      </FormField>

      <FormField
        id={employeeFieldId}
        label={role === "EMPLOYEE" ? "Employee" : "Employee (optional)"}
        error={employeeError}
      >
        <select
          {...errorAttributes(employeeFieldId, employeeError)}
          value={employeeId}
          onChange={(e) =>
            onEmployeeChange(e.target.value ? Number(e.target.value) : "")
          }
          className={inputClassName}
        >
          <option value="">
            {role === "EMPLOYEE" ? "Select employee" : "Not linked"}
          </option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name} — {employee.email}
            </option>
          ))}
        </select>
      </FormField>
    </>
  );
}
