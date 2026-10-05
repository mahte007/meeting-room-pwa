"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useOnlineStatus } from "@/hooks/use-online-status";

type QueryLike = Pick<
  UseQueryResult<unknown>,
  "data" | "isPending" | "isError" | "error" | "fetchStatus" | "dataUpdatedAt"
>;

export type CombinedQueryState =
  // Fetching data that isn't available yet.
  | { status: "loading" }
  // Offline, and the data was never loaded on this device.
  | { status: "offline" }
  // The request failed and there is no earlier data to fall back on.
  | { status: "error"; error: unknown }
  // Data is available. It may be from the persisted cache, possibly older
  // than the latest failed refresh (`refreshError`).
  | { status: "ready"; updatedAt: number; refreshError: unknown };

/**
 * Combines the queries a page needs into one state. Pass `false` for a
 * query that is disabled in the current situation (e.g. admin-only data),
 * since a disabled query never finishes loading.
 */
export function combineQueries(
  ...queries: (QueryLike | false | null | undefined)[]
): CombinedQueryState {
  const active = queries.filter((query): query is QueryLike => !!query);

  const failed = active.find(
    (query) => query.isError && query.data === undefined,
  );
  if (failed) return { status: "error", error: failed.error };

  // React Query pauses requests while offline instead of failing them.
  if (active.some((q) => q.isPending && q.fetchStatus === "paused")) {
    return { status: "offline" };
  }

  if (active.some((query) => query.isPending)) return { status: "loading" };

  return {
    status: "ready",
    updatedAt: Math.min(...active.map((query) => query.dataUpdatedAt)),
    refreshError: active.find((query) => query.isError)?.error ?? null,
  };
}

function formatUpdatedAt(timestamp: number) {
  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();

  return isToday ? date.toLocaleTimeString() : date.toLocaleString();
}

type QueryStateProps = {
  state: CombinedQueryState;
  loadingText: string;
  errorTitle: string;
};

/**
 * Shows loading, error and offline messages for a page's data. Renders
 * nothing when the data is fresh; when it comes from the cache while
 * offline, or a refresh failed, it notes how old the data is.
 */
export function QueryState({ state, loadingText, errorTitle }: QueryStateProps) {
  const isOnline = useOnlineStatus();

  switch (state.status) {
    case "loading":
      return (
        <div className="rounded-2xl border bg-white p-6">
          <p className="text-slate-600">{loadingText}</p>
        </div>
      );

    case "offline":
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-medium text-amber-800">You are offline.</p>
          <p className="mt-1 text-sm text-amber-700">
            This data hasn&apos;t been loaded on this device yet. It will load
            automatically when you are back online.
          </p>
        </div>
      );

    case "error":
      return (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <p className="font-medium text-red-700">{errorTitle}</p>
          <p className="mt-1 text-sm text-red-600">
            {state.error instanceof Error ? state.error.message : "Unknown error"}
          </p>
        </div>
      );

    case "ready": {
      if (isOnline && !state.refreshError) return null;

      const reason = isOnline ? "Couldn't refresh the data." : "You are offline.";

      return (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
        >
          {reason} Showing data from {formatUpdatedAt(state.updatedAt)}.
        </p>
      );
    }
  }
}
