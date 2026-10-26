import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const kiosk = read("src/fullscreen-kiosk.js");
const css = read("coach-studio-inline.css");

// v148.28 "scelta-schermo" — lo screenshot mostra l'app sul cover screen senza
// il pulsantino Samsung, e non compare nemmeno in Chrome: One UI 9 ha rimosso
// la maniglia dal cover screen. Inseguirla e' tempo perso: l'app basta a se
// stessa con un comando chiaro e un pannello a tre scelte.

// v148.34: il pulsante SCHERMO e' tornato (APK 1.3.0 con WebView propria)
assert.match(kiosk, /id = "bdFullscreenToggle"/, "v148.34: manca il pulsante SCHERMO");
assert.match(kiosk, /"SCHERMO"/, "manca il testo SCHERMO sul pulsante");
assert.match(kiosk, /function openSheet/, "manca il pannello delle scelte");
assert.match(kiosk, /openSheet\(\)/, "il pulsante non apre il pannello");
assert.match(kiosk, /bdFullscreenSheet/, "manca l'id del pannello");
assert.match(kiosk, /"dialog"/, "il pannello non e' un dialog accessibile");

assert.match(kiosk, /title: "Normale"/, "manca la scelta Normale");
assert.match(kiosk, /title: "Riempi schermo"/, "manca la scelta Riempi schermo");
assert.match(kiosk, /title: "Fullscreen vero"/, "manca la scelta Fullscreen vero");
assert.match(kiosk, /SHEET_ROWS\.forEach/, "le scelte non vengono generate");
assert.match(kiosk, /row\.mode === "off"\) exit\(\)/, "la scelta Normale non applica exit()");
assert.match(kiosk, /row\.mode === "fill"\) fill\(\)/, "la scelta Riempi schermo non applica fill()");

assert.match(kiosk, /function closeSheet/, "manca closeSheet()");
assert.match(kiosk, /event\.target === wrap/, "il pannello non si chiude toccando fuori");
assert.ok(
  !/while \(button\.firstChild\) button\.removeChild/.test(kiosk),
  "paint() svuota ancora il pulsante: l'etichetta SCHERMO sparirebbe"
);
assert.match(kiosk, /iconEl\.textContent/, "paint() non aggiorna l'icona");

// v148.34: il pulsante SCHERMO e' tornato (APK 1.3.0 con WebView propria)
assert.match(css, /\.bd-fs-toggle\s*\{/, "v148.34: CSS del pulsante SCHERMO assente");
assert.match(css, /\.bd-fs-sheet-card/, "CSS: manca la card del pannello");
assert.match(css, /html\[data-theme="light"\] \.bd-fs-sheet-card/, "CSS: il pannello non e' vestito nel tema chiaro");
assert.match(css, /\.bd-fs-option\[data-current="1"\]/, "CSS: la scelta attiva non si distingue");

console.log(JSON.stringify({ ok: true, schermo: "v148.28 pannello a tre scelte" }));
