"use client";

import { useCallback, useEffect, useState } from "react";

// How often a tab that stays open checks for a new deployment.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Registers the service worker and reports when a new version is installed
 * and waiting. The new worker only takes over when `applyUpdate` is called,
 * which then reloads the page so page and worker are the same version.
 */
export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    // The worker is only used in production builds; in development it would
    // serve stale bundles while editing.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;

    // An installed worker is an update only if a worker already controls the
    // page; otherwise it is the first install and activates on its own.
    function watchInstalling(worker: ServiceWorker | null) {
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
        }
      });
    }

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        registration = reg;

        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(reg.waiting);
        }

        watchInstalling(reg.installing);
        reg.addEventListener("updatefound", () =>
          watchInstalling(reg.installing),
        );
      })
      .catch((error) =>
        console.error("Service worker registration failed:", error),
      );

    // Browsers check for updates on page loads, but a tab can stay open for
    // days, so also check when it comes back into view and every hour.
    function checkForUpdate() {
      if (document.visibilityState === "visible") {
        registration?.update().catch(() => {});
      }
    }

    document.addEventListener("visibilitychange", checkForUpdate);
    const interval = window.setInterval(
      checkForUpdate,
      UPDATE_CHECK_INTERVAL_MS,
    );

    return () => {
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.clearInterval(interval);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;

    // Reload once the new worker has taken control of this page.
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );

    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  return { updateAvailable: waitingWorker !== null, applyUpdate };
}
