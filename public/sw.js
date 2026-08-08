const STATIC_CACHE = "static-v4";
const API_CACHE = "api-v5";

const OFFLINE_PAGE = "/offline";

const PAGE_CACHE_URLS = [
  "/",
  "/rooms",
  "/employees",
  "/reservations",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.add(OFFLINE_PAGE)),
  );

  /* event.waitUntil(
    caches.open("my-cache").then((cache) => {
      return cache.addAll(PAGE_CACHE_URLS);
    })
  ); */


  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, API_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      ),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  const isNextAsset =
    url.origin === self.location.origin &&
    url.pathname.startsWith("/_next/static");

  if (isNextAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        });
      }),
    );
    return;
  }

  const isPageRequest =
    url.origin === self.location.origin && request.mode === "navigate";

  if (isPageRequest) {
    const pageCacheKey = new Request(url.origin + url.pathname);

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(pageCacheKey, clone);
            });
          }

          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(pageCacheKey);

          if (cachedPage) {
            return cachedPage;
          }

          return caches.match(OFFLINE_PAGE);
        }),
    );

    return;
  }

  const isApiRead =
    url.pathname.startsWith("/api/rooms") ||
    url.pathname.startsWith("/api/reservations") ||
    url.pathname.startsWith("/api/employees");

  if (isApiRead) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();

          if (response.ok) {
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }

          return response;
        })
        .catch(() => caches.match(request)),
    );
  }
});
