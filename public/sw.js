// Service Worker — SuaAgenda.Pro
const CACHE_VERSION = "v1";
const STATIC_CACHE  = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/app",
  "/offline.html",
];

// Install: cache offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API routes: network-first, no cache fallback
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_server/")) {
    event.respondWith(
      fetch(request).catch(() => new Response("Service unavailable", { status: 503 }))
    );
    return;
  }

  // Static assets (JS/CSS/fonts/images): cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico)$/)
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // HTML navigation: network-first, offline page fallback
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((r) => r ?? new Response("Offline", { status: 503 }))
      )
    );
    return;
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};
  const title   = payload.title ?? "SuaAgenda.Pro";
  const options = {
    body:    payload.body ?? "Você tem uma nova notificação.",
    icon:    "/icon-192.png",
    badge:   "/icon-192.png",
    data:    { url: payload.url ?? "/" },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click: open/focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/app";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        const existing = wins.find((w) => w.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          return existing.navigate(target);
        }
        return clients.openWindow(target);
      })
  );
});
