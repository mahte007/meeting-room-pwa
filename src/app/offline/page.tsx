import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">You are offline</h1>

      <p className="text-slate-700">
        This page was not available in the cache. Open it once while online to
        make it available offline.
      </p>

      <Link
        href="/"
        className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Go to dashboard
      </Link>
    </section>
  );
}
