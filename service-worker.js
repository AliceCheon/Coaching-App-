const CACHE_NAME = "atlas-app-v138-photo-store";
const APP_SHELL = [
  "./",
  "./index.html",
  "./nutrizione/index.html",
  "./photo-store.js",
  "./manifest.webmanifest",
  "./app-icon.png",
  "./app-icon-192.png",
  "./app-icon-512.png",
  "./apple-touch-icon.png",
  "./coach-mascot.svg",
  "./dashboard-alimentazione-backup-2026-07-15.json",
  "./food-backup.js",
  "./atlas-nunito-sans.ttf",
  "./workout-pro.css",
  "./workout-pro.js",
  "./coach-studio.css",
  "./coach-program-editor-19.8.css",
  "./exercise-library-19.8.js",
  "./master-exercise-library.js",
  "./athlete-context.js",
  "./coach-ai-engine-2.js",
  "./knowledge-graph.js",
  "./decision-rules.js",
  "./decision-engine.js",
  "./coach-ai3-programming.js",
  "./coach-studio.js",
  "./sync-reliability.js",
  "./programming-engine.js"
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
