// An in-memory IndexedDB, used by the persisted query cache.
import "fake-indexeddb/auto";
// DOM matchers such as toBeInTheDocument() and toBeDisabled().
import "@testing-library/jest-dom/vitest";
import { createElement, type ReactNode } from "react";
import { cleanup } from "@testing-library/react";
import { onlineManager } from "@tanstack/react-query";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { resetNavigation } from "./src/test/navigation";
import { server } from "./src/test/server";

// next/navigation and next/link need a running Next.js app; tests use
// stand-ins (see src/test/navigation.ts).
vi.mock("next/navigation", async () => {
  const { nextNavigationMock } = await import("./src/test/navigation");
  return nextNavigationMock;
});

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetNavigation();
  localStorage.clear();

  // Undo setOnline(false) from src/test/render.tsx.
  delete (navigator as { onLine?: boolean }).onLine;
  onlineManager.setOnline(true);
});

afterAll(() => {
  server.close();
});
