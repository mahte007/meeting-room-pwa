"use client";

import { useState } from "react";
import { useServiceWorker } from "@/hooks/use-service-worker";

/** Registers the service worker and offers a reload when an update is ready. */
export function UpdatePrompt() {
  const { updateAvailable, applyUpdate } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  if (!updateAvailable || dismissed) return null;

  function handleReload() {
    setIsReloading(true);
    applyUpdate();
  }

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-lg"
    >
      <p className="text-sm text-slate-700">
        A new version of the app is available.
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => setDismissed(true)}
          className="rounded-xl border px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          Later
        </button>
        <button
          onClick={handleReload}
          disabled={isReloading}
          className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {isReloading ? "Reloading..." : "Reload"}
        </button>
      </div>
    </div>
  );
}
