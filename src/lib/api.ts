import { env } from "./env";
import type {
  ApiErrorPayload,
  ChangePasswordInput,
  CreateReservationInput,
  CurrentUser,
  Employee,
  Reservation,
  ReservationStatus,
  Room,
  SaveRoomInput,
  LoginInput,
  LoginResponse,
} from "./types";
import {
  getActiveRoomsMock,
  getActiveEmployeesMock,
  getActiveReservationsMock,
  createReservationMock,
  updateReservationMock,
  updateReservationStatusMock,
  archiveReservationMock,
  restoreReservationMock,
  getAllReservationsMock,
  getReservationsByEmployeeMock,
  getReservationMock,
  getRoomMock,
  getRoomsMock,
  createRoomMock,
  updateRoomMock,
  deactivateRoomMock,
  activateRoomMock,
  getReservationsByRoomMock,
  loginMock,
  changePasswordMock,
  getMeMock,
} from "./mock-api";
import { clearStoredAuthUser, getStoredAuthUser } from "./auth-storage";
import { ApiError } from "./api-error";

export { ApiError };

/**
 * Turns a failed request into a message for the user plus, for validation
 * errors, a message per form field.
 */
export function getErrorDetails(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return { message: error.message, fields: error.payload?.fields ?? {} };
  }

  return { message: fallbackMessage, fields: {} };
}

async function parseError(response: Response): Promise<never> {
  let payload: ApiErrorPayload | undefined;

  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  throw new ApiError(
    payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}`,
    response.status,
    payload,
  );
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const authUser = getStoredAuthUser();

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authUser?.token ? { Authorization: `Bearer ${authUser.token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    // An expired, invalid or revoked token. Clearing the stored user signs the
    // user out everywhere; ProtectedRoute then redirects to the login page.
    // Login failures also return 401, but no token is sent with them.
    if (response.status === 401 && authUser?.token) {
      clearStoredAuthUser();
    }

    await parseError(response);
  }

  // DELETE and password endpoints return 200 with an empty body.
  const text = await response.text();

  return (text ? JSON.parse(text) : undefined) as T;
}

export function login(input: LoginInput) {
  if (env.useMock) return loginMock(input);

  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Fetches the current user. Takes the token explicitly because right after
 * login it has not been stored yet.
 */
export function getMe(token: string) {
  if (env.useMock) return getMeMock(token);

  return apiFetch<CurrentUser>("/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getActiveRooms() {
  if (env.useMock) return getActiveRoomsMock();
  return apiFetch<Room[]>("/api/rooms/active");
}

export function getActiveEmployees() {
  if (env.useMock) return getActiveEmployeesMock();
  return apiFetch<Employee[]>("/api/employees/active");
}

export function getActiveReservations() {
  if (env.useMock) return getActiveReservationsMock();
  return apiFetch<Reservation[]>("/api/reservations/active");
}

export function createReservation(input: CreateReservationInput) {
  if (env.useMock) return createReservationMock(input);
  return apiFetch<Reservation>("/api/reservations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getReservation(id: number) {
  if (env.useMock) return getReservationMock(id);
  return apiFetch<Reservation>(`/api/reservations/${id}`);
}

export function updateReservation(id: number, input: CreateReservationInput) {
  if (env.useMock) return updateReservationMock(id, input);
  return apiFetch<Reservation>(`/api/reservations/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function updateReservationStatus(id: number, status: ReservationStatus) {
  if (env.useMock) return updateReservationStatusMock(id, status);
  return apiFetch<Reservation>(`/api/reservations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// DELETE does not remove the reservation, it sets `archived: true`.
export function archiveReservation(id: number) {
  if (env.useMock) return archiveReservationMock(id);
  return apiFetch<void>(`/api/reservations/${id}`, {
    method: "DELETE",
  });
}

export function getRoom(id: number) {
  if (env.useMock) return getRoomMock(id);
  return apiFetch<Room>(`/api/rooms/${id}`);
}

export function getReservationsByRoom(roomId: number) {
  if (env.useMock) return getReservationsByRoomMock(roomId);
  return apiFetch<Reservation[]>(`/api/reservations/room/${roomId}`);
}

export function changePassword(input: ChangePasswordInput) {
  if (env.useMock) return changePasswordMock(input);
  return apiFetch<void>("/api/me/password", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// Includes archived reservations.
export function getAllReservations() {
  if (env.useMock) return getAllReservationsMock();
  return apiFetch<Reservation[]>("/api/reservations");
}

export function getReservationsByEmployee(employeeId: number) {
  if (env.useMock) return getReservationsByEmployeeMock(employeeId);
  return apiFetch<Reservation[]>(`/api/reservations/employee/${employeeId}`);
}

export function restoreReservation(id: number) {
  if (env.useMock) return restoreReservationMock(id);
  return apiFetch<Reservation>(`/api/reservations/${id}/restore`, {
    method: "PATCH",
  });
}

// Includes inactive rooms.
export function getRooms() {
  if (env.useMock) return getRoomsMock();
  return apiFetch<Room[]>("/api/rooms");
}

export function createRoom(input: SaveRoomInput) {
  if (env.useMock) return createRoomMock(input);
  return apiFetch<Room>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateRoom(id: number, input: SaveRoomInput) {
  if (env.useMock) return updateRoomMock(id, input);
  return apiFetch<Room>(`/api/rooms/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// DELETE does not remove the room, it sets `active: false`.
export function deactivateRoom(id: number) {
  if (env.useMock) return deactivateRoomMock(id);
  return apiFetch<void>(`/api/rooms/${id}`, { method: "DELETE" });
}

export function activateRoom(id: number) {
  if (env.useMock) return activateRoomMock(id);
  return apiFetch<Room>(`/api/rooms/${id}/activate`, { method: "PATCH" });
}
