// Served at /sw.js by src/app/sw.js/route.ts, which replaces the placeholders
// below at build time. The build id changes this script's bytes on every
// build, which is what makes the browser install a new worker. Cache names
// include it, so each build also starts with clean caches.
const VERSION = "__BUILD_ID__";

// The app's static pages, e.g. ["/", "/rooms", ...], found in src/app.
const APP_PAGES = "__APP_PAGES__";

// This worker only caches the app shell (pages and static assets). API data
// is cached by the app itself in IndexedDB (see src/lib/query-persister.ts),
// where it is tied to the signed-in user and cleared on logout. A response
// cache here can't do that: its keys ignore the Authorization header.
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE];

const OFFLINE_PAGE = "/offline";

// Matches /_next/static/... URLs in a page's HTML, including the ones in
// Next's inline script data, where quotes are escaped with backslashes.
const STATIC_ASSET_URL = /\/_next\/static\/[^"'\\\s)]+/g;

/**
 * Caches a page's HTML and returns the static assets (JS, CSS, fonts) it
 * needs. Both are needed offline: the HTML alone would show, but never
 * start, without its scripts.
 */
async function precachePage(pagesCache, page) {
  const response = await fetch(page);

  if (!response.ok) throw new Error(`${page}: ${response.status}`);

  await pagesCache.put(page, response.clone());

  return (await response.text()).match(STATIC_ASSET_URL) ?? [];
}

/**
 * Precaches every static page with its assets. Users move around with
 * client-side navigation, which never requests a page's HTML, so without
 * this a page reached by clicking (or never visited) wouldn't open offline.
 */
async function precacheAppShell() {
  const pagesCache = await caches.open(PAGES_CACHE);
  const staticCache = await caches.open(STATIC_CACHE);

  // Required: without the offline page there is no fallback at all.
  const offlinePageAssets = await precachePage(pagesCache, OFFLINE_PAGE);

  // Best effort from here: one failed file shouldn't stop the install.
  const results = await Promise.allSettled(
    APP_PAGES.filter((page) => page !== OFFLINE_PAGE).map((page) =>
      precachePage(pagesCache, page),
    ),
  );

  const assets = new Set([
    ...offlinePageAssets,
    ...results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    ),
  ]);

  await Promise.allSettled([...assets].map((asset) => staticCache.add(asset)));
}

self.addEventListener("install", (event) => {
  // No skipWaiting() here: the new worker waits until the user accepts the
  // update, so open tabs never run old page code against a new worker.
  event.waitUntil(precacheAppShell());
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
  }
});
