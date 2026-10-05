import {
  mockEmployees,
  mockReservations,
  mockRooms,
} from "./mock-data";
import { getStoredAuthUser } from "./auth-storage";
import { createApiError } from "./api-error";
import { PASSWORD_MIN_LENGTH } from "./types";
import type {
  ChangePasswordInput,
  CreateReservationInput,
  CurrentUser,
  LoginInput,
  LoginResponse,
  Reservation,
  ReservationStatus,
  Room,
  SaveRoomInput,
  Employee,
  SaveEmployeeInput,
  User,
  CreateUserInput,
  UpdateUserInput,
} from "./types";

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let reservations = [...mockReservations];
let rooms = [...mockRooms];
let employees = [...mockEmployees];

const MOCK_TOKEN_PREFIX = "mock-jwt-token:";

// Mirrors the seeded backend accounts: "admin" has no linked employee and
// "mate" is linked to the first mock employee.
let users: User[] = [
  {
    id: 1,
    username: "admin",
    role: "ADMIN",
    employeeId: null,
    employeeName: null,
  },
  {
    id: 2,
    username: "mate",
    role: "EMPLOYEE",
    employeeId: mockEmployees[0].id,
    employeeName: mockEmployees[0].name,
  },
];

// The mock accepts any password, and unknown usernames log in as "mate".
function mockUserFor(username: string): CurrentUser {
  return (
    users.find((user) => user.username === username) ??
    users.find((user) => user.username === "mate")!
  );
}

export async function loginMock(input: LoginInput): Promise<LoginResponse> {
  await delay();

  const user = mockUserFor(input.username);

  return {
    token: `${MOCK_TOKEN_PREFIX}${user.username}`,
    username: user.username,
    role: user.role,
  };
}

export async function getMeMock(token: string): Promise<CurrentUser> {
  await delay();
  return mockUserFor(token.slice(MOCK_TOKEN_PREFIX.length));
}

export async function getActiveRoomsMock() {
  await delay();
  return rooms.filter((room) => room.active);
}

export async function getRoomsMock() {
  await delay();
  return rooms;
}

export async function getActiveEmployeesMock() {
  await delay();
  return employees.filter((employee) => employee.active);
}

export async function getEmployeesMock() {
  await delay();
  return employees;
}

export async function getActiveReservationsMock() {
  await delay();
  return reservations.filter((r) => !r.archived);
}

export async function getReservationMock(id: number) {
  await delay();
  const res = reservations.find((r) => r.id === id);
  if (!res) throw new Error("Reservation not found.");
  return res;
}

export async function createReservationMock(
  input: CreateReservationInput
): Promise<Reservation> {
  await delay();

  // Like the backend, employees always book for themselves.
  const currentUser = getStoredAuthUser();
  const employeeId =
    currentUser?.role === "EMPLOYEE"
      ? (currentUser.employeeId ?? 0)
      : (input.employeeId ?? 0);

  const newReservation: Reservation = {
    id: Date.now(),
    ...input,
    employeeId,
    status: "PLANNED",
    archived: false,
    employeeName: employees.find((e) => e.id === employeeId)?.name ?? "",
    roomName:
      rooms.find((r) => r.id === input.roomId)?.name ?? "",
  };

  reservations = [...reservations, newReservation];

  return newReservation;
}

export async function updateReservationMock(
  id: number,
  input: CreateReservationInput
) {
  await delay();

  reservations = reservations.map((r) =>
    r.id === id
      ? {
          ...r,
          ...input,
          employeeId: input.employeeId ?? r.employeeId,
        }
      : r
  );

  return reservations.find((r) => r.id === id)!;
}

export async function updateReservationStatusMock(
  id: number,
  status: ReservationStatus
) {
  await delay();

  reservations = reservations.map((r) =>
    r.id === id ? { ...r, status } : r
  );

  return reservations.find((r) => r.id === id)!;
}

export async function archiveReservationMock(id: number) {
  await delay();

  reservations = reservations.map((r) =>
    r.id === id ? { ...r, archived: true } : r
  );
}

export async function getRoomMock(id: number) {
  await delay();

  const room = rooms.find((room) => room.id === id);

  if (!room) {
    throw new Error("Room not found.");
  }

  return room;
}

export async function getReservationsByRoomMock(roomId: number) {
  await delay();

  return reservations.filter(
    (reservation) => reservation.roomId === roomId && !reservation.archived,
  );
}

export async function changePasswordMock(input: ChangePasswordInput) {
  await delay();

  // The mock has no stored passwords, so only the backend's length rule is checked.
  if (input.newPassword.length < PASSWORD_MIN_LENGTH) {
    throw new Error("Password must be at least 8 characters.");
  }
}

export async function getAllReservationsMock() {
  await delay();
  return reservations;
}

export async function getReservationsByEmployeeMock(employeeId: number) {
  await delay();

  return reservations.filter(
    (reservation) =>
      reservation.employeeId === employeeId && !reservation.archived,
  );
}

export async function restoreReservationMock(id: number) {
  await delay();

  reservations = reservations.map((r) =>
    r.id === id ? { ...r, archived: false } : r
  );

  return reservations.find((r) => r.id === id)!;
}

function assertUniqueRoomName(name: string, exceptId?: number) {
  const taken = rooms.some(
    (room) =>
      room.id !== exceptId &&
      room.name.toLowerCase() === name.trim().toLowerCase(),
  );

  if (taken) {
    throw createApiError(400, "BAD_REQUEST", "Room name already exists.");
  }
}

export async function createRoomMock(input: SaveRoomInput): Promise<Room> {
  await delay();
  assertUniqueRoomName(input.name);

  const room: Room = { id: Date.now(), ...input, active: true };
  rooms = [...rooms, room];

  return room;
}

export async function updateRoomMock(id: number, input: SaveRoomInput) {
  await delay();
  assertUniqueRoomName(input.name, id);

  rooms = rooms.map((room) => (room.id === id ? { ...room, ...input } : room));

  return rooms.find((room) => room.id === id)!;
}

export async function deactivateRoomMock(id: number) {
  await delay();

  const hasUpcoming = reservations.some(
    (r) =>
      r.roomId === id &&
      !r.archived &&
      (r.status === "PLANNED" || r.status === "APPROVED") &&
      new Date(r.endTime) > new Date(),
  );

  if (hasUpcoming) {
    throw createApiError(
      400,
      "BAD_REQUEST",
      "Room cannot be deactivated because it has upcoming reservations.",
    );
  }

  rooms = rooms.map((room) =>
    room.id === id ? { ...room, active: false } : room,
  );
}

export async function activateRoomMock(id: number) {
  await delay();

  rooms = rooms.map((room) =>
    room.id === id ? { ...room, active: true } : room,
  );

  return rooms.find((room) => room.id === id)!;
}

export async function getEmployeeMock(id: number) {
  await delay();

  const employee = employees.find((e) => e.id === id);

  if (!employee) {
    throw createApiError(404, "NOT_FOUND", "Employee not found.");
  }

  return employee;
}

function assertUniqueEmail(email: string, exceptId?: number) {
  const taken = employees.some(
    (e) =>
      e.id !== exceptId && e.email.toLowerCase() === email.toLowerCase(),
  );

  if (taken) {
    throw createApiError(400, "BAD_REQUEST", "Email already exists.");
  }
}

export async function createEmployeeMock(
  input: SaveEmployeeInput,
): Promise<Employee> {
  await delay();
  assertUniqueEmail(input.email);

  const employee: Employee = { id: Date.now(), ...input, active: true };
  employees = [...employees, employee];

  return employee;
}

export async function updateEmployeeMock(id: number, input: SaveEmployeeInput) {
  await delay();
  assertUniqueEmail(input.email, id);

  employees = employees.map((e) => (e.id === id ? { ...e, ...input } : e));

  return employees.find((e) => e.id === id)!;
}

export async function deactivateEmployeeMock(id: number) {
  await delay();

  const hasUpcoming = reservations.some(
    (r) =>
      r.employeeId === id &&
      !r.archived &&
      (r.status === "PLANNED" || r.status === "APPROVED") &&
      new Date(r.endTime) > new Date(),
  );

  if (hasUpcoming) {
    throw createApiError(
      400,
      "BAD_REQUEST",
      "Employee cannot be deactivated because they have upcoming reservations.",
    );
  }

  employees = employees.map((e) =>
    e.id === id ? { ...e, active: false } : e,
  );
}

export async function activateEmployeeMock(id: number) {
  await delay();

  employees = employees.map((e) => (e.id === id ? { ...e, active: true } : e));

  return employees.find((e) => e.id === id)!;
}

export async function getUsersMock() {
  await delay();
  return [...users].sort((a, b) => a.username.localeCompare(b.username));
}

// Applies the backend's account rules for linking an employee.
function resolveLinkedEmployee(
  role: User["role"],
  employeeId: number | null | undefined,
  exceptUserId?: number,
) {
  if (employeeId == null) {
    if (role === "EMPLOYEE") {
      throw createApiError(
        400,
        "BAD_REQUEST",
        "Employee accounts must be linked to an employee.",
      );
    }

    return null;
  }

  const employee = employees.find((e) => e.id === employeeId);

  if (!employee) {
    throw createApiError(404, "NOT_FOUND", "Employee not found.");
  }

  if (!employee.active) {
    throw createApiError(400, "BAD_REQUEST", "Employee is not active.");
  }

  if (users.some((u) => u.id !== exceptUserId && u.employeeId === employeeId)) {
    throw createApiError(
      400,
      "BAD_REQUEST",
      "Employee already has a user account.",
    );
  }

  return employee;
}

export async function createUserMock(input: CreateUserInput): Promise<User> {
  await delay();

  if (users.some((u) => u.username === input.username)) {
    throw createApiError(400, "BAD_REQUEST", "Username already exists.");
  }

  const employee = resolveLinkedEmployee(input.role, input.employeeId);

  const user: User = {
    id: Date.now(),
    username: input.username,
    role: input.role,
    employeeId: employee?.id ?? null,
    employeeName: employee?.name ?? null,
  };

  users = [...users, user];

  return user;
}

export async function updateUserMock(id: number, input: UpdateUserInput) {
  await delay();

  const user = users.find((u) => u.id === id);

  if (!user) throw createApiError(404, "NOT_FOUND", "User not found.");

  if (
    user.username === getStoredAuthUser()?.username &&
    user.role !== input.role
  ) {
    throw createApiError(
      400,
      "BAD_REQUEST",
      "You cannot change your own role.",
    );
  }

  const employee = resolveLinkedEmployee(input.role, input.employeeId, id);

  const updated: User = {
    ...user,
    role: input.role,
    employeeId: employee?.id ?? null,
    employeeName: employee?.name ?? null,
  };

  users = users.map((u) => (u.id === id ? updated : u));

  return updated;
}

export async function resetUserPasswordMock(id: number, password: string) {
  await delay();

  if (!users.some((u) => u.id === id)) {
    throw createApiError(404, "NOT_FOUND", "User not found.");
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw createApiError(
      400,
      "BAD_REQUEST",
      "Password must be at least 8 characters.",
    );
  }
}

export async function deleteUserMock(id: number) {
  await delay();

  const user = users.find((u) => u.id === id);

  if (!user) throw createApiError(404, "NOT_FOUND", "User not found.");

  if (user.username === getStoredAuthUser()?.username) {
    throw createApiError(
      400,
      "BAD_REQUEST",
      "You cannot delete your own account.",
    );
  }

  users = users.filter((u) => u.id !== id);
}

export async function getAvailableRoomsMock(start: string, end: string) {
  await delay();

  if (new Date(start) >= new Date(end)) {
    throw createApiError(
      400,
      "BAD_REQUEST",
      "Start time must be before end time.",
    );
  }

  // Same overlap rule as the backend; back-to-back bookings don't clash.
  return rooms.filter(
    (room) =>
      room.active &&
      !reservations.some(
        (r) =>
          r.roomId === room.id &&
          !r.archived &&
          r.status !== "CANCELLED" &&
          new Date(r.startTime) < new Date(end) &&
          new Date(r.endTime) > new Date(start),
      ),
  );
}
