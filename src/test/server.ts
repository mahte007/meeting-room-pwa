import { HttpResponse } from "msw";
import { setupServer } from "msw/node";

/**
 * A fake backend for component tests. MSW intercepts fetch at the network
 * level, so components run the real API client against it. Each test adds
 * the handlers it needs with `server.use(...)`; any request without a
 * handler fails the test, so no request goes unnoticed.
 */
export const server = setupServer();

// Matches NEXT_PUBLIC_API_BASE_URL in vitest.config.ts.
const API_BASE_URL = "http://api.test";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

/** A response shaped like the backend's error format. */
export function apiError(
  status: number,
  error: string,
  message: string,
  fields?: Record<string, string>,
) {
  return HttpResponse.json(
    { error, message, timestamp: "2026-10-06T10:00:00", ...(fields && { fields }) },
    { status },
  );
}
