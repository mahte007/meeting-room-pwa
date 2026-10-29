import { describe, expect, it } from "vitest";
import type { PersistedClient } from "@tanstack/react-query-persist-client";
import { clearStoredAuthUser, storeAuthUser } from "./auth-storage";
import { queryPersister } from "./query-persister";

function signInAs(username: string) {
  storeAuthUser({
    username,
    role: "EMPLOYEE",
    token: `token-${username}`,
    employeeId: 1,
    employeeName: username,
  });
}

function cacheWith(marker: string): PersistedClient {
  return {
    timestamp: Date.now(),
    buster: "1",
    clientState: { mutations: [], queries: [{ marker } as never] },
  };
}

// Each test starts from an empty IndexedDB store.
async function reset() {
  await queryPersister.removeClient();
}

describe("queryPersister", () => {
  it("restores the cache for the user who saved it", async () => {
    await reset();
    signInAs("mate");
    const cache = cacheWith("mate's data");

    await queryPersister.persistClient(cache);

    await expect(queryPersister.restoreClient()).resolves.toEqual(cache);
  });

  it("does not restore another user's cache, and deletes it", async () => {
    await reset();
    signInAs("mate");
    await queryPersister.persistClient(cacheWith("mate's data"));

    // e.g. mate's session expired and anna signed in on the same device.
    signInAs("anna");

    await expect(queryPersister.restoreClient()).resolves.toBeUndefined();

    // Gone for good, not just hidden from anna.
    signInAs("mate");
    await expect(queryPersister.restoreClient()).resolves.toBeUndefined();
  });

  it("does not save anything while nobody is signed in", async () => {
    await reset();
    clearStoredAuthUser();

    await queryPersister.persistClient(cacheWith("orphaned"));

    signInAs("mate");
    await expect(queryPersister.restoreClient()).resolves.toBeUndefined();
  });

  it("removes the saved cache", async () => {
    await reset();
    signInAs("mate");
    await queryPersister.persistClient(cacheWith("mate's data"));

    await queryPersister.removeClient();

    await expect(queryPersister.restoreClient()).resolves.toBeUndefined();
  });
});
