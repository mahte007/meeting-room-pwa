"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", roles: ["ADMIN", "EMPLOYEE"] },
  { href: "/rooms", label: "Rooms", roles: ["ADMIN", "EMPLOYEE"] },
  { href: "/rooms/available", label: "Find a room", roles: ["ADMIN", "EMPLOYEE"] },
  { href: "/reservations", label: "Reservations", roles: ["ADMIN", "EMPLOYEE"] },
  { href: "/calendar", label: "Calendar", roles: ["ADMIN", "EMPLOYEE"] },
  { href: "/employees", label: "Employees", roles: ["ADMIN"] },
  { href: "/users", label: "Users", roles: ["ADMIN"] },
];

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();

  const visibleNavItems = navItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Meeting Room Reservation
        </Link>

        {isAuthenticated && (
          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Link
                href="/profile"
                className="hover:text-slate-950 hover:underline"
              >
                {user?.username} ({user?.role})
              </Link>

              <button
                onClick={logout}
                className="rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
