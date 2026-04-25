import {
  mockEmployees,
  mockReservations,
  mockRooms,
} from "./mock-data";
import type {
  CreateReservationInput,
  Reservation,
  ReservationStatus,
} from "./types";

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let reservations = [...mockReservations];

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
  return reservations;
}

export async function getReservationMock(id: number) {
  await delay();
  const res = reservations.find((r) => r.id === id);
  if (!res) throw new Error("Not found");
  return res;
}

export async function createReservationMock(
  input: CreateReservationInput
): Promise<Reservation> {
  await delay();

  const newReservation: Reservation = {
    id: Date.now(),
    ...input,
    status: "PENDING",
    archived: false,
    employeeName:
      mockEmployees.find((e) => e.id === input.employeeId)?.name ?? "",
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

export async function deleteReservationMock(id: number) {
  await delay();

  reservations = reservations.filter((r) => r.id !== id);
}