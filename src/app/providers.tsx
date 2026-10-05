"use client";

import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PropsWithChildren, useState } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { queryPersister } from "@/lib/query-persister";

// How long cached data stays usable, e.g. for viewing offline.
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Bump when the shape of cached API data changes, so old caches are dropped.
const CACHE_VERSION = "1";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            // Unused data must stay in memory at least as long as it may be
            // persisted, or it would be dropped before it is saved.
            gcTime: CACHE_MAX_AGE_MS,
          },
        },
      })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: CACHE_MAX_AGE_MS,
        buster: CACHE_VERSION,
        dehydrateOptions: {
          // Room availability changes constantly; an old answer is worse than
          // none, so it is never saved.
          shouldDehydrateQuery: (query) =>
            query.queryKey[1] !== "available" &&
            defaultShouldDehydrateQuery(query),
        },
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </PersistQueryClientProvider>
  );
}
