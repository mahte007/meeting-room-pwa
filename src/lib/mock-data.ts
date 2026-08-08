import type { Employee, Reservation, Room } from "./types";

export const mockRooms: Room[] = [
  {
    id: 1,
    name: "Conference A",
    capacity: 10,
    location: "1st Floor",
    hasProjector: true,
    active: true,
  },
  {
    id: 2,
    name: "Conference B",
    capacity: 6,
    location: "2nd Floor",
    hasProjector: false,
    active: true,
  },
];

export const mockEmployees: Employee[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    department: "Engineering",
    role: "Frontend Dev",
    active: true,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    department: "HR",
    role: "Manager",
    active: true,
  },
];

export const mockReservations: Reservation[] = [
  {
    id: 1,
    title: "Team Sync",
    description: "Weekly sync meeting",
    startTime: "2026-04-25T10:00:00",
    endTime: "2026-04-25T11:00:00",
    attendeeCount: 5,
    status: "APPROVED",
    archived: false,
    employeeId: 1,
    employeeName: "John Doe",
    roomId: 1,
    roomName: "Conference A",
  },
];