import {
  mockEmployees,
  mockReservations,
  mockRooms,
} from "./mock-data";
import { getStoredAuthUser } from "./auth-storage";
import { PASSWORD_MIN_LENGTH } from "./types";
import type {
  ChangePasswordInput,
  CreateReservationInput,
  CurrentUser,
  LoginInput,
  LoginResponse,
  Reservation,
  ReservationStatus,
} from "./types";

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let reservations = [...mockReservations];

const MOCK_TOKEN_PREFIX = "mock-jwt-token:";

// Mirrors the seeded backend accounts: "admin" has no linked employee, every
// other username is linked to the first mock employee.
function mockUserFor(username: string): CurrentUser {
  const isAdmin = username === "admin";
  const employee = isAdmin ? null : mockEmployees[0];

  return {
    id: isAdmin ? 1 : 2,
    username,
    role: isAdmin ? "ADMIN" : "EMPLOYEE",
    employeeId: employee?.id ?? null,
    employeeName: employee?.name ?? null,
  };
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
  return mockRooms;
}

export async function getActiveEmployeesMock() {
  await delay();
  return mockEmployees;
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
    employeeName: mockEmployees.find((e) => e.id === employeeId)?.name ?? "",
    roomName:
      mockRooms.find((r) => r.id === input.roomId)?.name ?? "",
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

  const room = mockRooms.find((room) => room.id === id);

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
