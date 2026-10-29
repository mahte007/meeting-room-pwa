import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { ProtectedRoute } from "./protected-route";
import { adminUser, employeeUser } from "@/test/fixtures";
import { router, setNavigation } from "@/test/navigation";
import { renderWithProviders, signIn } from "@/test/render";

describe("ProtectedRoute", () => {
  it("sends signed-out visitors to the login page, remembering where they were", async () => {
    setNavigation({ pathname: "/reservations" });

    renderWithProviders(
      <ProtectedRoute>
        <p>Secret</p>
      </ProtectedRoute>,
    );

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        "/login?redirect=%2Freservations",
      ),
    );
    expect(screen.queryByText("Secret")).toBeNull();
  });

  it("shows the page to a user with an allowed role", async () => {
    signIn(adminUser);

    renderWithProviders(
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <p>Admin area</p>
      </ProtectedRoute>,
    );

    expect(await screen.findByText("Admin area")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sends a user without the role back to the dashboard", async () => {
    signIn(employeeUser);

    renderWithProviders(
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <p>Admin area</p>
      </ProtectedRoute>,
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("Admin area")).toBeNull();
  });
});
