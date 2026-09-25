// v147.62 — Cover screen (FlexWindow) edge-to-edge SENZA TWA.
//
// Su Android il manifest con `display: "fullscreen"` mappa sul cutout mode
// DEFAULT/NEVER e lascia una fascia (bianca/nera) esattamente nel foro
// fotocamere, anche con viewport-fit=cover. `requestFullscreen()` invece imposta
// LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES: quella superficie viene sbloccata e
// il canvas arriva ai bordi fisici, dietro il cutout.
//
// Quindi l'app resta `standalone` nel manifest e chiede il fullscreen al primo
// gesto utente. Deve essere silenzioso (catch) e una sola volta.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = (p) => fs.readFileSync(path.join(root, p), "utf8");
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const read = (p) => stripComments(raw(p));

// --- 1) Il manifest NON deve chiedere fullscreen a livello Android. ---------
const manifest = JSON.parse(raw("manifest.webmanifest").replace(/^\uFEFF/, ""));
assert.ok(!manifest.display_override?.includes("fullscreen"), "display_override fullscreen lascia la fascia nel cutout: usare requestFullscreen()");
assert.notEqual(manifest.display, "fullscreen", "display fullscreen e' la causa della fascia nel cutout");

// --- 2) index.html chiede il fullscreen al primo gesto. ---------------------
const html = raw("index.html");
const boot = html.match(/requestFullscreen[\s\S]*?<\/script>/);
assert.ok(boot, "index.html deve chiamare requestFullscreen()");
assert.match(html, /documentElement\.requestFullscreen|root\.requestFullscreen/, "requestFullscreen sul documentElement");
assert.match(html, /addEventListener\("pointerdown"[\s\S]*?once:\s*true/, "fullscreen al primo pointerdown (gesto utente richiesto)");
assert.match(html, /once:\s*true/, "l'ascoltatore deve essere once (un solo tentativo)");
assert.match(html, /\.catch\(function\s*\(\)\s*\{\s*\}\)/, "il rifiuto del browser deve essere silenzioso");
// Deve essere innocuo: nessun throw se l'API manca, e nessun override dell'UI.
assert.match(html, /if\s*\(root\.requestFullscreen/, "il tentativo e' condizionato alla presenza dell'API");

// --- 3) L'UI resta dentro la safe area (canvas a filo, UI no). --------------
const css = read("coach-studio-inline.css");
assert.match(css, /\.app-header[^}]*env\(safe-area-inset-top/, "l'header deve usare safe-area-inset-top") ;
assert.ok(!/(?:^|\})\s*html\s*\{[^}]*safe-area-inset-top/s.test(css), "il canvas non deve avere inset: deve arrivare ai bordi fisici");

console.log(JSON.stringify({ ok: true, checks: 9, fix: "FlexWindow edge-to-edge via requestFullscreen(): niente TWA, canvas dietro il cutout, UI in safe area" }));
