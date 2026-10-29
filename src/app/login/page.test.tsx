import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import LoginPage from "./page";
import { employeeUser } from "@/test/fixtures";
import { router, setNavigation } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import { apiError, apiUrl, server } from "@/test/server";
import { getStoredAuthUser } from "@/lib/auth-storage";

function backendAccepts(username: string, password: string) {
  server.use(
    http.post(apiUrl("/api/auth/login"), async ({ request }) => {
      const body = (await request.json()) as { username: string; password: string };

      if (body.username !== username || body.password !== password) {
        return apiError(401, "UNAUTHORIZED", "Invalid username or password.");
      }

      return HttpResponse.json({ token: "jwt-token", username, role: "EMPLOYEE" });
    }),
    http.get(apiUrl("/api/me"), ({ request }) =>
      request.headers.get("Authorization") === "Bearer jwt-token"
        ? HttpResponse.json(employeeUser)
        : apiError(401, "UNAUTHORIZED", "Authentication required."),
    ),
  );
}

async function logIn(username: string, password: string) {
  const result = renderWithProviders(<LoginPage />);

  await result.user.type(screen.getByLabelText("Username"), username);
  await result.user.type(screen.getByLabelText("Password"), password);
  await result.user.click(screen.getByRole("button", { name: "Login" }));

  return result;
}

describe("LoginPage", () => {
  it("starts with empty fields", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText("Username")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("signs in, loads the user's details and opens the dashboard", async () => {
    backendAccepts("mate", "mate1234");

    await logIn("mate", "mate1234");

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    // employeeId comes from /api/me, not from the login response.
    expect(getStoredAuthUser()).toMatchObject({
      username: "mate",
      token: "jwt-token",
      employeeId: 1,
    });
  });

  it("returns to the page the user originally asked for", async () => {
    backendAccepts("mate", "mate1234");
    setNavigation({ pathname: "/login", search: "redirect=/reservations?view=mine" });

    await logIn("mate", "mate1234");

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/reservations?view=mine"),
    );
  });

  it("ignores a redirect to another site", async () => {
    backendAccepts("mate", "mate1234");
    setNavigation({ pathname: "/login", search: "redirect=https://evil.example" });

    await logIn("mate", "mate1234");

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });

  it("shows the backend's message for wrong credentials", async () => {
    backendAccepts("mate", "mate1234");

    await logIn("mate", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid username or password.",
    );
    expect(getStoredAuthUser()).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
