import type { AuthUser } from "./types";

const AUTH_STORAGE_KEY = "meeting-room-auth";

type Listener = () => void;

const listeners = new Set<Listener>();

// Cached so getStoredAuthUser returns a stable reference between changes,
// which useSyncExternalStore requires.
let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (raw === cachedRaw) return cachedUser;

  cachedRaw = raw;

  if (!raw) {
    cachedUser = null;
    return null;
  }

  try {
    cachedUser = JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    cachedRaw = null;
    cachedUser = null;
  }

  return cachedUser;
}

export function storeAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  notify();
}

export function clearStoredAuthUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  notify();
}

export function subscribeToAuthUser(listener: Listener) {
  listeners.add(listener);

  // Keeps other tabs in sync when the user logs in or out there.
  function handleStorage(event: StorageEvent) {
    if (event.key === AUTH_STORAGE_KEY) listener();
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Reads the `exp` claim (seconds since epoch) from a JWT and returns it in
 * milliseconds, or null if the token has no readable expiry.
 */
export function getTokenExpiry(token: string): number | null {
  const payload = token.split(".")[1];

  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(base64)) as { exp?: number };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry <= Date.now();
}
