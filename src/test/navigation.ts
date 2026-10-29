import { vi } from "vitest";

/**
 * Stand-in for next/navigation, which only works inside a running Next.js
 * app. Tests set the current URL with `setNavigation` and check where the
 * app navigated through `router`.
 */
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

let pathname = "/";
let searchParams = new URLSearchParams();
let params: Record<string, string> = {};

export function setNavigation(options: {
  pathname?: string;
  search?: string;
  params?: Record<string, string>;
}) {
  pathname = options.pathname ?? pathname;
  searchParams = new URLSearchParams(options.search ?? "");
  params = options.params ?? params;
}

export function resetNavigation() {
  pathname = "/";
  searchParams = new URLSearchParams();
  params = {};
  Object.values(router).forEach((fn) => fn.mockReset());
}

export const nextNavigationMock = {
  useRouter: () => router,
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
  useParams: () => params,
};
