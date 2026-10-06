import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { AuthProvider } from "@/contexts/auth-context";
import { storeAuthUser } from "@/lib/auth-storage";
import type { User } from "@/lib/types";
import { toAuthUser } from "./fixtures";
import { apiUrl, server } from "./server";

/**
 * Signs `user` in the way the app finds them after a page load: stored in
 * localStorage, with GET /api/me confirming the token.
 */
export function signIn(user: User) {
  storeAuthUser(toAuthUser(user));
  server.use(http.get(apiUrl("/api/me"), () => HttpResponse.json(user)));
}

/**
 * Renders `ui` inside the app's providers, with a fresh query cache per
 * test and no retries, so failures show up immediately.
 */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  return {
    user: userEvent.setup(),
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{ui}</AuthProvider>
      </QueryClientProvider>,
    ),
  };
}

/** Switches the browser between online and offline, like the OS would. */
export function setOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => online,
  });
  window.dispatchEvent(new Event(online ? "online" : "offline"));
}
