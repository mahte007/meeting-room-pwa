const STATIC_CACHE = "static-v1";
const API_CACHE = "api-v1";

const STATIC_ASSETS = ["/", "/rooms", "/reservations", "/employees"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, API_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  const isStaticAsset =
    url.origin === self.location.origin &&
    (request.destination === "document" ||
      request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "image" ||
      request.destination === "font");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
            return response;
          })
        );
      })
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
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});