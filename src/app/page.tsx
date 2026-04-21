import Link from "next/link";

const cards = [
  {
    href: "/rooms",
    title: "Rooms",
    description: "Browse active meeting rooms and their properties.",
  },
  {
    href: "/employees",
    title: "Employees",
    description: "View active employees available in the system.",
  },
  {
    href: "/reservations",
    title: "Reservations",
    description: "Check active reservations and their current status.",
  },
];

export default function HomePage() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Meeting Room Reservation PWA</h1>
        <p className="max-w-3xl text-slate-700">
          This Progressive Web Application uses a Spring Boot backend and
          provides installable, app-like behavior with offline access to cached
          read data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5"
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}