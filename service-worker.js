const CACHE_NAME = "atlas-app-v95";
const APP_SHELL = [
  "./",
  "./index.html",
  "./atlas-coach-app.html",
  "./nutrizione/index.html",
  "./manifest.webmanifest",
  "./app-icon.png",
  "./app-icon-192.png",
  "./app-icon-512.png",
  "./apple-touch-icon.png",
  "./coach-mascot.svg",
  "./dashboard-alimentazione-backup-2026-07-15.json",
  "./food-backup.js",
  "./atlas-nunito-sans.ttf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isHtml = event.request.mode === "navigate" || event.request.destination === "document" || new URL(event.request.url).pathname.endsWith(".html");
  if (isHtml) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});
