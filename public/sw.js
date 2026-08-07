const CACHE_NAME = "artaries-receipt-v3";

// Core static assets required for the app shell to function offline
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/artarieslogo.png",
  "/favicon.ico",
  "/apple-touch-icon.png",
];

// Install event: Pre-cache shell assets individually so single 404s never break install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`[SW] Precache failed for ${url}:`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches & claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: 100% robust offline handler for iOS Safari & Standalone PWA
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only intercept GET requests
  if (request.method !== "GET") return;

  // Ignore non-http/https requests (e.g. data:, blob:, chrome-extension://)
  if (!request.url.startsWith("http://") && !request.url.startsWith("https://")) {
    return;
  }

  // Use async IIFE to ALWAYS return a valid Response object (prevents iOS respondWith error)
  event.respondWith(
    (async () => {
      try {
        // 1. Check cache first for instant offline response
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          // Update cache in background when online (Stale-While-Revalidate)
          if (navigator.onLine) {
            fetch(request)
              .then(async (networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  const cache = await caches.open(CACHE_NAME);
                  cache.put(request, networkResponse);
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }

        // 2. Fetch from network if not in cache
        const networkResponse = await fetch(request);
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type !== "opaque"
        ) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // 3. Network failed (Offline mode)
        // For HTML navigation requests, return cached "/"
        if (request.mode === "navigate") {
          const cache = await caches.open(CACHE_NAME);
          const rootFallback = await cache.match("/");
          if (rootFallback) return rootFallback;
        }

        // 4. Ultimate Fallback: MUST return a valid Response object (NEVER undefined!)
        return new Response(
          "<!DOCTYPE html><html><body style='font-family:sans-serif;text-align:center;padding:2rem;'><h2>You are offline</h2><p>Please check your connection or reopen saved app.</p></body></html>",
          {
            status: 200,
            headers: new Headers({ "Content-Type": "text/html" }),
          }
        );
      }
    })()
  );
});
