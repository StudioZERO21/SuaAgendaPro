// Service Worker — SuaAgenda.Pro
const CACHE_VERSION = "v3-1.0.1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
  "/app-manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

function isHashedAsset(pathname) {
  return /\.[a-f0-9]{8,}\.(js|css)$/i.test(pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_server/")) {
    event.respondWith(
      fetch(request).catch(
        () => new Response("Serviço indisponível", { status: 503 }),
      ),
    );
    return;
  }

  // JS/CSS com hash: stale-while-revalidate (rápido + atualiza em background)
  if (
    isHashedAsset(url.pathname) ||
    url.pathname.match(/\.(woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico)$/)
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
    return;
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match("/offline.html")
          .then((r) => r ?? new Response("Offline", { status: 503 })),
      ),
    );
    return;
  }
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};
  const title = payload.title ?? "SuaAgenda.Pro";
  const options = {
    body: payload.body ?? "Você tem uma nova notificação.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url ?? "/" },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

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
      }),
  );
});
