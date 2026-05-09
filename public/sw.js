/* Stack Sift service worker
 * - precaches the offline shell (offline.html, manifest, icons)
 * - network-first for navigation requests, falls back to offline.html
 * - stale-while-revalidate for /assets/* (Vite-fingerprinted, safe to cache forever)
 * - never caches /api/* or supabase calls
 */
const VERSION = "v1";
const CACHE_STATIC = `static-${VERSION}`;
const CACHE_RUNTIME = `runtime-${VERSION}`;

const PRECACHE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_STATIC && key !== CACHE_RUNTIME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Don't intercept cross-origin or auth/data requests.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/auth/")) return;

  // Navigation requests → network-first, fall back to cached offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_RUNTIME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/offline.html"))),
    );
    return;
  }

  // Hashed assets → stale-while-revalidate.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_STATIC).then((cache) => cache.put(request, copy));
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      }),
    );
    return;
  }

  // Everything else: cache-first then network.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
