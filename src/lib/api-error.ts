import type { ApiErrorPayload } from "./types";

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

/** Builds an error shaped like a backend error response. */
export function createApiError(status: number, error: string, message: string) {
  return new ApiError(message, status, {
    error,
    message,
    timestamp: new Date().toISOString(),
  });
}
