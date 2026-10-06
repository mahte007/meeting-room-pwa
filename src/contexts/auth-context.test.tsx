import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useAuth } from "./auth-context";
import { employeeUser, toAuthUser } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { apiError, apiUrl, server } from "@/test/server";
import { getStoredAuthUser, storeAuthUser } from "@/lib/auth-storage";

function CurrentUser() {
  const { user, isAuthenticated } = useAuth();

  return (
    <p>
      {isAuthenticated
        ? `${user?.username} (employee ${user?.employeeId ?? "none"})`
        : "signed out"}
    </p>
  );
}

describe("AuthProvider", () => {
  it("refreshes a stored session's details from /api/me on start", async () => {
    // An older session stored before employeeId was saved.
    storeAuthUser({ ...toAuthUser(employeeUser), employeeId: null });
    server.use(http.get(apiUrl("/api/me"), () => HttpResponse.json(employeeUser)));

    renderWithProviders(<CurrentUser />);

    expect(await screen.findByText("mate (employee 1)")).toBeInTheDocument();
  });

  it("signs out when the stored token is no longer accepted", async () => {
    storeAuthUser(toAuthUser(employeeUser));
    server.use(
      http.get(apiUrl("/api/me"), () =>
        apiError(401, "UNAUTHORIZED", "Authentication required."),
      ),
    );

    renderWithProviders(<CurrentUser />);

    expect(await screen.findByText("signed out")).toBeInTheDocument();
    expect(getStoredAuthUser()).toBeNull();
  });

  it("keeps the session when /api/me can't be reached, e.g. offline", async () => {
    storeAuthUser(toAuthUser(employeeUser));
    let requested = false;
    server.use(
      http.get(apiUrl("/api/me"), () => {
        requested = true;
        return HttpResponse.error();
      }),
    );

    renderWithProviders(<CurrentUser />);

    // Wait for the request to fail, then let its handlers run.
    await waitFor(() => expect(requested).toBe(true));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getStoredAuthUser()).not.toBeNull();
    expect(screen.getByText("mate (employee 1)")).toBeInTheDocument();
  });
});
