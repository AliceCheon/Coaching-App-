// FASE 0.5 — Fonte unica di versione.
// Storia: index.html era arrivato a 9 valori ?v= diversi (v14723, v1451-contrast,
// v1461c10, v14726, v14728, v14730, v14731, v14742, v14743) mentre app-config
// dichiarava "v147.38-nutrition-purge": il cache-busting non era più affidabile e
// nessun test si accorgeva del drift. Da questa build la fonte della versione è
// app-config-v144.js (BarbellDivaV144Config.build / .cache). Procedura di rilascio:
//   1. aggiorna build + cache in app-config-v144.js;
//   2. allinea i ?v= di index.html, manifest.webmanifest e CACHE_NAME del
//      service worker al nuovo token (v147.X → "v147X");
//   3. questo test fallisce finché un punto resta indietro.
import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("..", import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), "utf8");
const config = read("app-config-v144.js");
const html = read("index.html");
const manifest = read("manifest.webmanifest");
const sw = read("service-worker.js");
const fbDoc = read("FIREBASE-LOGIN.md");

const build = config.match(/build:\s*"([^"]+)"/)?.[1];
const cache = config.match(/cache:\s*"([^"]+)"/)?.[1];
assert.ok(build, "app-config: campo build mancante");
assert.ok(cache, "app-config: campo cache mancante");

// Token cache-bust derivato dalla build: "v147.59-edge-to-edge" → "v14757".
const tokenMatch = build.match(/^v(\d+)\.(\d+)/);
assert.ok(tokenMatch, `build non nel formato atteso vMAJOR.MINOR-suffisso: ${build}`);
const token = `v${tokenMatch[1]}${tokenMatch[2]}`;

// 1) index.html: OGNI ?v= deve essere il token della build, senza eccezioni.
const htmlParams = [...html.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].map((m) => m[1]);
assert.ok(htmlParams.length >= 30, `index.html: attesi ≥30 cache-bust, trovati ${htmlParams.length}`);
const fuori = [...new Set(htmlParams)].filter((v) => v !== token);
assert.deepEqual(fuori, [], `index.html: valori ?v= fuori allineamento: ${fuori.join(", ")}`);

// 2) manifest.webmanifest: start_url + shortcuts con lo stesso token.
const manifestParams = [...manifest.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].map((m) => m[1]);
assert.ok(manifestParams.length > 0, "manifest: nessun ?v= trovato");
const fuoriManifest = [...new Set(manifestParams)].filter((v) => v !== token);
assert.deepEqual(fuoriManifest, [], `manifest: valori ?v= fuori allineamento: ${fuoriManifest.join(", ")}`);

// 3) service worker: CACHE_NAME = "atlas-app-<token>-<suffisso di build>".
const suffix = build.replace(/^v[\d.]+-/, "");
const swCache = sw.match(/const CACHE_NAME = "([^"]+)"/)?.[1];
assert.equal(swCache, `atlas-app-${token}-${suffix}`, "service worker: CACHE_NAME non allineato a app-config");

// 4) La registrazione del SW a runtime è già guidata da APP_BUILD (config).
const appMain = read("src/app-main.js");
assert.ok(appMain.includes("service-worker.js?v=${APP_BUILD}"), "registrazione SW non guidata da APP_BUILD");
assert.ok(appMain.includes('updateViaCache: "none"'), "registrazione SW senza bypass cache: update ostacolato");

// 5) La doc di login pubblica la build corrente.
assert.ok(fbDoc.includes(build), "FIREBASE-LOGIN.md: build non documentata");

console.log(JSON.stringify({ ok: true, build, token, cache, cacheBusts: htmlParams.length }));
