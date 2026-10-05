"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Alert } from "@/components/ui/alert";
import { combineQueries, QueryState } from "@/components/ui/query-state";
import { getLinkableEmployees } from "@/components/users/account-fields";
import { CreateUserForm } from "@/components/users/create-user-form";
import { UserRow } from "@/components/users/user-row";
import { useAuth } from "@/contexts/auth-context";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getActiveEmployees, getUsers } from "@/lib/api";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isOnline = useOnlineStatus();
  const [message, setMessage] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", "active"],
    queryFn: getActiveEmployees,
  });

  const users = usersQuery.data ?? [];
  const employees = employeesQuery.data ?? [];

  const queryState = combineQueries(usersQuery, employeesQuery);

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="mt-2 text-slate-700">
            Login accounts and their permission roles. Employee accounts are
            always linked to an employee; admin accounts may be.
          </p>
        </div>

        {!isOnline && (
          <Alert variant="warning">
            You are offline. Managing logins requires an internet connection.
          </Alert>
        )}

        {message && <Alert variant="success">{message}</Alert>}

        <QueryState
          state={queryState}
          loadingText="Loading users..."
          errorTitle="Failed to load users."
        />

        {queryState.status === "ready" && (
          <>
            <CreateUserForm
              linkableEmployees={getLinkableEmployees(employees, users)}
              disabled={!isOnline}
              onCreated={(user) => setMessage(`Login ${user.username} created.`)}
            />

            <div className="grid gap-4">
              {users.map((user) => (
                <UserRow
                  // Remount after a save so the edit fields reset to the
                  // latest values from the server.
                  key={`${user.id}-${user.role}-${user.employeeId}`}
                  user={user}
                  isSelf={user.username === currentUser?.username}
                  linkableEmployees={getLinkableEmployees(
                    employees,
                    users,
                    user,
                  )}
                  disabled={!isOnline}
                  onSuccess={setMessage}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </ProtectedRoute>
  );
}
