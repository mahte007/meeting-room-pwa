// An in-memory IndexedDB, used by the persisted query cache.
import "fake-indexeddb/auto";
import { afterEach } from "vitest";

afterEach(() => {
  localStorage.clear();
});
