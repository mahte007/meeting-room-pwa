/**
 * Captures the browser's install prompt. Chromium browsers fire
 * `beforeinstallprompt` once when the app becomes installable, possibly
 * before React has rendered, so the listener is registered as soon as this
 * module loads. Calling preventDefault() stops the browser's own mini
 * infobar so the app can offer an install button at a better moment.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function subscribeToInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function canPromptInstall() {
  return deferredPrompt !== null;
}

/** Shows the browser's install dialog. Resolves true if the user accepted. */
export async function promptInstall() {
  const prompt = deferredPrompt;

  if (!prompt) return false;

  // A prompt can only be used once.
  deferredPrompt = null;
  notify();

  await prompt.prompt();
  const { outcome } = await prompt.userChoice;

  return outcome === "accepted";
}
