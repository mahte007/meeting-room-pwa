const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/rooms", label: "Rooms" },
  { href: "/reservations", label: "Reservations" },
  { href: "/employees", label: "Employees" },
];

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="/" className="text-lg font-bold text-slate-900">
          Meeting Room Reservation
        </a>

        <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-slate-950">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}