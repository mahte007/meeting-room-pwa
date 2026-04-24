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
  | "PENDING"
  | "APPROVED"
  | "CANCELLED"
  | "COMPLETED";

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
  employeeId: number;
  roomId: number;
};

export type ApiErrorPayload = {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  validationErrors?: Record<string, string>;
};