export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === "true",
};