"use client";

import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", roles: ["ADMIN", "EMPLOYEE"] },
    { href: "/rooms", label: "Rooms", roles: ["ADMIN", "EMPLOYEE"] },
    { href: "/reservations", label: "Reservations", roles: ["ADMIN", "EMPLOYEE"] },
    { href: "/employees", label: "Employees", roles: ["ADMIN"] },
  ] as const;

  const visibleNavItems = navItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="/" className="text-lg font-bold text-slate-900">
          Meeting Room Reservation
        </a>

        {isAuthenticated && (
          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
              {visibleNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="hover:text-slate-950"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>
                {user?.username} ({user?.role})
              </span>

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