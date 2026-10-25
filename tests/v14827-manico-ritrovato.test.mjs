import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const manifest = JSON.parse(read("manifest.webmanifest"));
const css = read("coach-studio-inline.css");
const kiosk = read("src/fullscreen-kiosk.js");

// v148.27 "manico-ritrovato" — Alice, 26 ottobre: "non mi esce il pulsantino
// samsung quando apro l'app... la barra e' completamente bianca... prima di
// One UI 9.0 non c'era".
//
// CAUSA: `display: "fullscreen"` nel manifest. MDN: apre l'app con la UI del
// browser nascosta e usa TUTTA l'area disponibile; e' separato dalla Fullscreen
// API (document.fullscreenElement resta null). One UI 9, che ha rinnovato il
// cover screen con home screen e app drawer, lo applica alla lettera: manico
// assente, e la fascia sotto resta il canvas bianco del WebView.
// Nessun codice in pagina poteva rimediare: non e' un fullscreen che si possa
// "uscire", e' la modalita' con cui il sistema lancia l'app.

// 1) IL MANIFEST NON CHIEDE PIU' IL FULLSCREEN DI SISTEMA.
assert.equal(
  manifest.display,
  "standalone",
  "display: con fullscreen One UI 9 sopprime il manico del cover screen"
);
assert.ok(
  !(manifest.display_override || []).includes("fullscreen"),
  "display_override contiene ancora fullscreen (il manico sparisce di nuovo)"
);
assert.ok((manifest.display_override || []).includes("standalone"), "manca standalone in display_override");

// 2) LA BARRA BIANCA: il root deve dipingere anche l'area del manico.
assert.match(css, /min-height:\s*100lvh/, "manca 100lvh: l'area del manico resta sul canvas bianco");
assert.match(css, /html\s*\{[^}]*background-color:\s*#090918/, "html senza background-color opaco");
assert.match(css, /html\[data-theme="light"\]\s*\{[^}]*background-color:\s*#fff7fb/, "manca il fondo opaco del tema chiaro");
assert.match(css, /body\s*\{[^}]*background-color:/, "body senza fondo opaco (il gradiente non copre l'area scoperta)");

// 3) IL MODULO RESTA MA NON E' PIU' IL RESPONSABILE DEL MANICO: il fullscreen
//    nativo e' una SCELTA (tondino), non l'avvio. Il default resta fill.
assert.match(kiosk, /return "fill";/, "il default del tondino non e' piu' fill");
assert.match(kiosk, /function fill\(\)/, "manca la modalita' fill");
assert.match(kiosk, /bbd:fullscreenchange|bd:fullscreenchange/, "manca l'evento di stato");

// 4) La diagnostica deve poter dire la verita' sulla modalita' di lancio.
assert.match(kiosk, /displayModes/, "la diagnostica non riporta i display-mode");
assert.match(kiosk, /window-controls-overlay/, "la diagnostica non elenca tutti i display-mode");

console.log(JSON.stringify({ ok: true, manifest: "standalone, manico vivo, canvas dipinto" }));
