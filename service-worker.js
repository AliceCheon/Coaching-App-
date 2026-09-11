/* Barbell Diva - Service Worker
   v14729-clean-header
   - HTML: network-first con timeout (3s) + fallback cache → app shell
   - Asset statici: cache-first con refresh in background (stale-while-revalidate)
   - Match con ignoreSearch: resiste ai bump di versione (?v=...) e ai doppioni in cache
   - Cache key normalizzate per pathname (niente duplicati per ogni ?v=)
*/
const CACHE_NAME = "atlas-app-v14729-clean-header";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app-icon-192.png",
  "./app-icon-512.png",
  "./apple-touch-icon.png",
  "./coach-mascot.svg",
  "./atlas-nunito-sans.ttf",
  "./coach-studio.css",
  "./coach-program-editor-19.8.css",
  "./coach-tools-v1451.css",
  "./unified-sidebar-v1452.css",
  "./coach-schede-restyle-v146.css",
  "./workout-flow-v147.css",
  "./coach-studio-inline.css",
  "./src/utils-global.js",
  "./src/utils.js",
  "./src/firebase-app-check.js",
  "./src/app-main.js",
  "./src/app-integration.js",
  "./src/pr-celebrations.js",
  "./src/consistency-heatmap.js",
  "./src/progress-charts.js",
  "./src/quick-log.js",
  "./src/ui-enhancements.js",
  "./src/diva-personality.js",
  "./src/diva-bot-sounds.js",
  "./src/goals-stats.js",
  "./src/notifications.js",
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
  "./programming-engine.js",
  "./app-config-v144.js",
  "./coach-schede-v146-enhance.js",
  "./workout-flow-v147.js"
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
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("network timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isHtml =
    request.mode === "navigate" ||
    request.destination === "document" ||
    url.pathname.endsWith(".html");

  if (isHtml) {
    // Network-first con timeout: se la rete risponde entro 3 secondi aggiorna la
    // cache e serve la pagina; altrimenti ripiega sulla copia cacheata (o sull'app shell).
    event.respondWith(
      withTimeout(fetch(request, { cache: "no-store" }), 3000)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(new Request(url.pathname), copy));
          return response;
        })
        .catch(() =>
          caches.match(request, { ignoreSearch: true }).then(
            (cached) => cached || caches.match("./index.html")
          )
        )
    );
    return;
  }

  // Asset statici: cache-first con refresh in background (stale-while-revalidate).
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(new Request(url.pathname), copy));
          }
          return response;
        })
        .catch(() => null);

      if (cached) {
        // aggiorna la copia in cache senza bloccare la risposta all'utente
        networkFetch.catch(() => {});
        return cached;
      }

      return networkFetch.then((fresh) => {
        if (fresh) return fresh;
        // ultima spiaggia: risposta offline di cortesia
        return new Response("", { status: 503, statusText: "Offline" });
      });
    })
  );
});
