const CACHE_NAME = "artaries-receipt-v2";

// Core static assets required for the app shell to function offline
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/arterieslogo.png",
  "/arterieslogo.svg",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/apple-touch-icon-120x120.png",
  "/apple-touch-icon-120x120-precomposed.png"
];

// Install event: Pre-cache core shell assets & skip waiting
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("Some precache assets failed to load, proceeding anyway:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up stale caches & claim clients immediately
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

// Fetch event: Comprehensive offline caching strategy for iOS Safari & Standalone PWA
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Ignore non-http/https requests (e.g. chrome-extension://, data:, blob:)
  if (!request.url.startsWith("http://") && !request.url.startsWith("https://")) {
    return;
  }

  const url = new URL(request.url);

  // Strategy 1: HTML Navigation requests (pages)
  // Network first -> fallback to Cache -> fallback to cached "/"
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match("/");
          });
        })
    );
    return;
  }

  // Strategy 2: Next.js static assets (_next/static/...), images, fonts, and local scripts
  // Cache First -> Network update in background (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type !== "opaque"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // Silent catch for network failures when offline
          return null;
        });

      // Return cached version immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise.then((netResp) => {
        if (netResp) return netResp;
        // Fallback response if both cache and network fail
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});
