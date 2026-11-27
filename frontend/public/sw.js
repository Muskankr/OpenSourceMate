/**
 * OpenSourceMate Service Worker
 * Caches application shell, static assets, and the most recent user analysis data.
 * Supports offline browsing and deterministic cache invalidation upon deployment.
 */

const SW_VERSION = "v1.0.0";
const SHELL_CACHE_NAME = `osm-shell-${SW_VERSION}`;
const DATA_CACHE_NAME = `osm-data-${SW_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE_NAME, DATA_CACHE_NAME];

// Essential application shell assets to pre-cache during installation
const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/image.png",
];

// Service Worker installation: pre-cache application shell assets
self.addEventListener("install", (event) => {
  // Activate updated service worker immediately without waiting for existing clients to close
  self.skipWaiting();

  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        // Pre-caching failure for non-critical assets should not prevent service worker installation
        console.warn("[SW] Non-critical shell asset pre-cache warning:", err);
      });
    })
  );
});

// Service Worker activation: remove outdated caches from older deployments
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!CURRENT_CACHES.includes(cacheName)) {
              console.log("[SW] Evicting outdated cache:", cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event handler: network-first with cache fallback for HTML and API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests and http/https schemes
  if (request.method !== "GET") return;
  if (!request.url.startsWith("http://") && !request.url.startsWith("https://")) return;

  const url = new URL(request.url);

  // 1. Navigation requests (App Shell HTML)
  // Network-first: try network to get freshest page; on offline or error fallback to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match("/");
          });
        })
    );
    return;
  }

  // 2. API requests for profile analysis and recommendations
  // Network-first: fetch fresh GitHub analysis, cache response in DATA_CACHE_NAME on 200 OK.
  // When offline, serve the most recently cached analysis response.
  if (url.pathname.startsWith("/api/github/users/") || url.pathname.startsWith("/api/matching/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached;
            }
            return new Response(
              JSON.stringify({
                error: "Offline",
                message: "You are currently offline. Please reconnect to access live data.",
                offline: true,
              }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }
            );
          });
        })
    );
    return;
  }

  // 3. Static assets: Next.js static bundles, images, icons, and styling
  // Cache-first: fast load from cache with background network refresh
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Opportunistically update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cached;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cached);
      })
    );
    return;
  }
});

// Listen for message events (e.g. from client update triggers)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
