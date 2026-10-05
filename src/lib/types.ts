export type Room = {
  id: number;
  name: string;
  capacity: number;
  location: string;
  hasProjector: boolean;
  active: boolean;
};

export type Employee = {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  active: boolean;
};

export type ReservationStatus =
  | "PLANNED"
  | "APPROVED"
  | "CANCELLED"
  | "COMPLETED";

export const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PLANNED: ["APPROVED", "CANCELLED"],
  APPROVED: ["CANCELLED", "COMPLETED"],
  CANCELLED: [],
  COMPLETED: [],
};

// Cancelled and completed reservations can no longer be edited.
export const FINAL_STATUSES: ReservationStatus[] = ["CANCELLED", "COMPLETED"];

export type Reservation = {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  status: ReservationStatus;
  archived: boolean;
  employeeId: number;
  employeeName: string;
  roomId: number;
  roomName: string;
};

export type CreateReservationInput = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  employeeId?: number;
  roomId: number;
};

export type ApiErrorPayload = {
  error: string;
  message: string;
  timestamp: string;
  // Only present for VALIDATION_ERROR responses.
  fields?: Record<string, string>;
};

export type UserRole = "ADMIN" | "EMPLOYEE";

export type LoginInput = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  username: string;
  role: UserRole;
};

// Returned by GET /api/me.
export type CurrentUser = {
  id: number;
  username: string;
  role: UserRole;
  employeeId: number | null;
  employeeName: string | null;
};

export type AuthUser = {
  username: string;
  role: UserRole;
  token: string;
  employeeId: number | null;
  employeeName: string | null;
};
export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

export type SaveRoomInput = {
  name: string;
  capacity: number;
  location: string;
  hasProjector: boolean;
};
