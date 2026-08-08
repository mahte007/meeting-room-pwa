import { env } from "./env";
import type {
  ApiErrorPayload,
  CreateReservationInput,
  Employee,
  Reservation,
  ReservationStatus,
  Room,
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
  deleteReservationMock,
  getReservationMock,
  getRoomMock,
  getReservationsByRoomMock,
} from "./mock-api";
import { getStoredAuthUser } from "./auth-storage";

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
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
    await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function login(input: LoginInput) {
  if (env.useMock) {
    return Promise.resolve<LoginResponse>({
      token: "mock-jwt-token",
      username: input.username,
      role: input.username === "admin" ? "ADMIN" : "EMPLOYEE",
    });
  }

  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
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

export function deleteReservation(id: number) {
  if (env.useMock) return deleteReservationMock(id);
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
