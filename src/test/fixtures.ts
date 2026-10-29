import type {
  AuthUser,
  Employee,
  Reservation,
  Room,
  User,
} from "@/lib/types";

// Mirrors the backend's seeded accounts.
export const adminUser: User = {
  id: 1,
  username: "admin",
  role: "ADMIN",
  employeeId: null,
  employeeName: null,
};

export const employeeUser: User = {
  id: 2,
  username: "mate",
  role: "EMPLOYEE",
  employeeId: 1,
  employeeName: "Máté Horváth",
};

export function toAuthUser(user: User): AuthUser {
  return {
    username: user.username,
    role: user.role,
    token: `token-${user.username}`,
    employeeId: user.employeeId,
    employeeName: user.employeeName,
  };
}

export const rooms: Room[] = [
  {
    id: 1,
    name: "Room A",
    capacity: 6,
    location: "1st floor",
    hasProjector: true,
    active: true,
  },
  {
    id: 2,
    name: "Room B",
    capacity: 12,
    location: "2nd floor",
    hasProjector: false,
    active: true,
  },
];

export const employees: Employee[] = [
  {
    id: 1,
    name: "Máté Horváth",
    email: "mate@example.com",
    department: "Engineering",
    role: "Developer",
    active: true,
  },
  {
    id: 2,
    name: "Anna Kovács",
    email: "anna@example.com",
    department: "HR",
    role: "HR Manager",
    active: true,
  },
];

let nextId = 100;

export function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: nextId++,
    title: "Team sync",
    description: null,
    startTime: "2030-01-07T10:00:00",
    endTime: "2030-01-07T11:00:00",
    attendeeCount: 4,
    status: "PLANNED",
    archived: false,
    employeeId: 1,
    employeeName: "Máté Horváth",
    roomId: 1,
    roomName: "Room A",
    ...overrides,
  };
}
