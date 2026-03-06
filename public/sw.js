const CACHE_NAME = "artaries-receipt-v1";

// Assets to pre-cache for full offline support
const PRECACHE_URLS = ["/", "/manifest.json", "/arterieslogo.svg"];

// Install event: pre-cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }),
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event: serve from cache first, fall back to network, then cache the response
self.addEventListener("fetch", (event) => {
  // Bypass service worker interception completely for localhost/HTTP development
  // to avoid iOS "HTTPS-only" navigation errors
  if (
    self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1"
  ) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version, but also update cache in background
        event.waitUntil(
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {
              // Network failed, that's fine - we already have cached version
            }),
        );
        return cachedResponse;
      }

      // Not in cache, fetch from network and cache the result
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === "opaque"
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline and not in cache - return a simple fallback for navigation
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});
