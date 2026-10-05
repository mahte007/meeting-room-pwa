import { createStore, del, get, set, type UseStore } from "idb-keyval";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { getStoredAuthUser } from "./auth-storage";

/**
 * Saves the React Query cache in IndexedDB so previously loaded data is
 * available after a reload or restart, including offline. IndexedDB is used
 * rather than localStorage because it is asynchronous (doesn't block the
 * page while saving) and has far more space.
 */

const CACHE_KEY = "react-query-cache";

type StoredCache = {
  // Username of whoever was signed in when the cache was saved.
  owner: string;
  client: PersistedClient;
};

let store: UseStore | undefined;

// Opened lazily: IndexedDB only exists in the browser.
function getStore() {
  store ??= createStore("meeting-room-pwa", "query-cache");
  return store;
}

export const queryPersister = {
  async persistClient(client) {
    const owner = getStoredAuthUser()?.username;

    // Never save data that no signed-in user owns, e.g. while signing out.
    if (!owner) return;

    await set(CACHE_KEY, { owner, client } satisfies StoredCache, getStore());
  },

  async restoreClient() {
    const stored = await get<StoredCache>(CACHE_KEY, getStore());

    if (!stored) return undefined;

    // Only restore the signed-in user's own data, e.g. if someone else's
    // session expired on this device without a proper logout.
    if (stored.owner !== getStoredAuthUser()?.username) {
      await del(CACHE_KEY, getStore());
      return undefined;
    }

    return stored.client;
  },

  async removeClient() {
    await del(CACHE_KEY, getStore());
  },
} satisfies Persister;
