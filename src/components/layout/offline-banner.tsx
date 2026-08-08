"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800">
      You are offline. Previously loaded data may still be available, but creating,
      editing, deleting, or changing reservations requires an internet connection.
    </div>
  );
}