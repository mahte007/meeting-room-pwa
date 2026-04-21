import { env } from "./env";
import type {
  ApiErrorPayload,
  Employee,
  Reservation,
  Room,
} from "./types";

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
    payload?.message || payload?.error || `Request failed with status ${response.status}`,
    response.status,
    payload
  );
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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

export function getActiveRooms() {
  return apiFetch<Room[]>("/api/rooms/active");
}

export function getActiveEmployees() {
  return apiFetch<Employee[]>("/api/employees/active");
}

export function getActiveReservations() {
  return apiFetch<Reservation[]>("/api/reservations/active");
}