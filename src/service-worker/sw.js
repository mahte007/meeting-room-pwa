// Served at /sw.js by src/app/sw.js/route.ts, which replaces the placeholder
// below with the build id. Every build therefore changes this script's bytes,
// which is what makes the browser install a new worker. Cache names include
// the version, so each build also starts with clean caches.
const VERSION = "__BUILD_ID__";

const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const API_CACHE = `api-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

const OFFLINE_PAGE = "/offline";

self.addEventListener("install", (event) => {
  // No skipWaiting() here: the new worker waits until the user accepts the
  // update, so open tabs never run old page code against a new worker.
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => cache.add(OFFLINE_PAGE)),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Stores a successful response without delaying the one sent to the page. */
function putInCache(event, cacheName, key, response) {
  if (!response.ok) return;

  const copy = response.clone();
  event.waitUntil(caches.open(cacheName).then((cache) => cache.put(key, copy)));
}

// Cache first: /_next/static files have content hashes in their names, so a
// cached copy is never stale.
function handleStaticAsset(event) {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        putInCache(event, STATIC_CACHE, event.request, response);
        return response;
      });
    }),
  );
}

// Network first: always try for the latest page, fall back to the last copy
// seen online, and finally to the offline page.
function handleNavigation(event, url) {
  // Ignore the query string so e.g. /reservations?view=mine still works offline.
  const cacheKey = new Request(url.origin + url.pathname);

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        putInCache(event, PAGES_CACHE, cacheKey, response);
        return response;
      })
      .catch(
        async () =>
          (await caches.match(cacheKey)) ?? caches.match(OFFLINE_PAGE),
      ),
  );
}

// Network first for API reads, falling back to the last successful response.
function handleApiRead(event) {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        putInCache(event, API_CACHE, event.request, response);
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin && url.pathname.startsWith("/_next/static")) {
    handleStaticAsset(event);
    return;
  }

  if (isSameOrigin && request.mode === "navigate") {
    handleNavigation(event, url);
    return;
  }

  const isApiRead =
    url.pathname.startsWith("/api/rooms") ||
    url.pathname.startsWith("/api/reservations") ||
    url.pathname.startsWith("/api/employees");

  if (isApiRead) {
    handleApiRead(event);
  }
});
