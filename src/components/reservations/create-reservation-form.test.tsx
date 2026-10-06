import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { CreateReservationForm } from "./create-reservation-form";
import { adminUser, employees, employeeUser, rooms } from "@/test/fixtures";
import { renderWithProviders, setOnline, signIn } from "@/test/render";
import type { CreateReservationInput } from "@/lib/types";

const validValues: Partial<CreateReservationInput> = {
  title: "Team sync",
  startTime: "2030-01-07T10:00:00",
  endTime: "2030-01-07T11:00:00",
  attendeeCount: 4,
  roomId: 1,
};

function renderForm(
  props: Partial<Parameters<typeof CreateReservationForm>[0]> = {},
) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  const result = renderWithProviders(
    <CreateReservationForm
      rooms={rooms}
      employees={employees}
      onSubmit={onSubmit}
      isSubmitting={false}
      submitError={null}
      {...props}
    />,
  );

  return { ...result, onSubmit };
}

describe("CreateReservationForm", () => {
  it("reports every missing required field", async () => {
    signIn(adminUser);
    const { user, onSubmit } = renderForm();

    await user.click(screen.getByRole("button", { name: "Create reservation" }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Room is required.")).toBeInTheDocument();
    expect(screen.getByText("Employee is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("links error messages to their inputs for screen readers", async () => {
    signIn(employeeUser);
    const { user } = renderForm();

    await user.click(screen.getByRole("button", { name: "Create reservation" }));

    const title = screen.getByLabelText("Title");
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription("Title is required.");
  });

  it("rejects an end time before the start time", async () => {
    signIn(employeeUser);
    const { user, onSubmit } = renderForm({
      initialValues: { ...validValues, endTime: "2030-01-07T09:00:00" },
    });

    await user.click(screen.getByRole("button", { name: "Create reservation" }));

    expect(screen.getByText("End time must be after start time.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects more attendees than the room holds", async () => {
    signIn(employeeUser);
    const { user, onSubmit } = renderForm({
      initialValues: { ...validValues, attendeeCount: 7 }, // Room A holds 6
    });

    await user.click(screen.getByRole("button", { name: "Create reservation" }));

    expect(screen.getByText("This room only supports 6 attendees.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("lets an employee book only for themselves", async () => {
    signIn(employeeUser);
    const { user, onSubmit } = renderForm({ initialValues: validValues });

    // No employee picker for employees.
    expect(screen.queryByLabelText("Employee")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Create reservation" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Team sync",
      description: "",
      // Sent in the backend's format: local time with seconds, no timezone.
      startTime: "2030-01-07T10:00:00",
      endTime: "2030-01-07T11:00:00",
      attendeeCount: 4,
      // Omitted: the backend books employees for themselves.
      employeeId: undefined,
      roomId: 1,
    });
  });

  it("lets an admin book on behalf of an employee", async () => {
    signIn(adminUser);
    const { user, onSubmit } = renderForm({ initialValues: validValues });

    await user.selectOptions(screen.getByLabelText("Employee"), "Anna Kovács — HR");
    await user.click(screen.getByRole("button", { name: "Create reservation" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 2 }),
    );
  });

  it("trims the title and description", async () => {
    signIn(employeeUser);
    const { user, onSubmit } = renderForm({ initialValues: validValues });

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "  Planning  ");
    await user.type(screen.getByLabelText("Description"), "  Q4 roadmap  ");
    await user.click(screen.getByRole("button", { name: "Create reservation" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Planning", description: "Q4 roadmap" }),
    );
  });

  it("shows the backend's field errors next to the fields", () => {
    signIn(employeeUser);
    renderForm({
      submitError: "Validation failed.",
      serverFieldErrors: { title: "Title must be at most 255 characters." },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Validation failed.");
    expect(screen.getByLabelText("Title")).toHaveAccessibleDescription(
      "Title must be at most 255 characters.",
    );
  });

  it("cannot be submitted while offline", () => {
    signIn(employeeUser);
    setOnline(false);
    renderForm({ initialValues: validValues });

    expect(screen.getByRole("button", { name: "Create reservation" })).toBeDisabled();
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();
  });
});
