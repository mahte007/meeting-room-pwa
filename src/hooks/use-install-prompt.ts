"use client";

import { useSyncExternalStore } from "react";
import {
  canPromptInstall,
  promptInstall,
  subscribeToInstallPrompt,
} from "@/lib/install-prompt";

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeToDisplayMode(callback: () => void) {
  const query = window.matchMedia(STANDALONE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function isStandalone() {
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    // Older iOS versions only expose this non-standard flag.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iOS has no install prompt; installing is a manual "Add to Home Screen".
// iPadOS reports itself as a Mac, so it is recognised by its touch screen.
function isIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function subscribeNoop() {
  return () => {};
}

/**
 * How the app can be installed in this browser:
 * - "installed": already running as an installed app
 * - "prompt": the browser's install dialog is available
 * - "ios": install manually from the Share menu
 * - "unavailable": not installable here (or not yet)
 */
export function useInstallPrompt() {
  const standalone = useSyncExternalStore(
    subscribeToDisplayMode,
    isStandalone,
    () => false,
  );

  const canPrompt = useSyncExternalStore(
    subscribeToInstallPrompt,
    canPromptInstall,
    () => false,
  );

  const ios = useSyncExternalStore(subscribeNoop, isIos, () => false);

  const mode = standalone
    ? "installed"
    : canPrompt
      ? "prompt"
      : ios
        ? "ios"
        : "unavailable";

  return { mode, promptInstall } as const;
}
