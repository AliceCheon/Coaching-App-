import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const html = read("index.html");
const kiosk = read("src/fullscreen-kiosk.js");
const css = read("coach-studio-inline.css");
const sw = read("service-worker.js");
const manifest = JSON.parse(read("manifest.webmanifest"));

// v148.25 "schermo-esterno" — dopo l'aggiornamento l'app non entrava piu' a
// schermo intero e il pulsantino di sistema restava freezato. Le cause erano
// tre, tutte sorvegliate qui:
//
// 1) RIARMO A OGNI TOCCO. `requestFullscreen()` veniva richiesto su ogni
//    pointerdown/touchstart/keydown: l'app rientrava in fullscreen un istante
//    dopo che One UI ne era uscita, quindi il comando (manico / "dimensione
//    app" del cover screen) risultava morto. Non deve tornare.
assert.ok(
  !/requestFullscreen\(\)\s*\n?\s*\)?;?\s*\}\s*\n\s*\};?\s*\n\s*window\.addEventListener\(\s*["']pointerdown["']/.test(kiosk),
  "kiosk: il fullscreen viene ancora richiesto a ogni tocco"
);
assert.ok(
  !/addEventListener\(\s*["']pointerdown["']\s*,\s*go\b/.test(html + kiosk),
  "kiosk: riarmo del fullscreen a ogni pointerdown (freeza il comando di sistema)"
);
// Una sola richiesta automatica per caricamento: `once: true` sugli ascoltatori.
assert.ok(!/requestFullscreen\(/.test((kiosk.split("function armAuto()")[1] || "").split("function")[0] || ""), "v148.30: niente fullscreen automatico al tocco — nasconderebbe pulsantino e barre di sistema");

// 2) CANCELLO DI MISURA. `innerHeight <= 560 && innerWidth <= 760` spegneva il
//    fullscreen appena One UI cambiava la finestra: via, per sempre.
assert.ok(!/innerHeight\s*<=\s*560/.test(kiosk), "kiosk: e' tornato il cancello di misura 560px");
assert.ok(!/innerWidth\s*<=\s*760/.test(kiosk), "kiosk: e' tornato il cancello di misura 760px");
assert.match(kiosk, /display-mode: standalone|display-mode: fullscreen/, "kiosk: manca il riconoscimento dell'app installata");
assert.match(kiosk, /display-mode: browser/, "kiosk: manca l'esclusione del browser normale");

// 3) FALLIMENTO SILENZIOSO. Se il browser rifiuta, deve dirlo: `reject` +
//    ripiego CSS "riempi schermo", che non tocca lo stato di sistema.
assert.match(kiosk, /reject/, "kiosk: la promise di requestFullscreen non distingue il rifiuto");
assert.match(kiosk, /bd-fill/, "kiosk: manca la modalita' riempi schermo");
assert.match(css, /html\.bd-fill/, "CSS: manca html.bd-fill (modalita' riempi schermo)");
assert.match(kiosk, /diagnostics/, "kiosk: nessuna diagnostica leggibile");
assert.match(kiosk, /lastError/, "kiosk: l'ultimo errore non viene conservato");

// 4) PULSANTE IN-APP. Deve esistere, nascere dal modulo e vivere fuori dal
//    flusso (non sposta il layout del cover screen).
// v148.31: il pulsante SCHERMO e' stato rimosso su richiesta di Alice
assert.ok(true, "pulsante rimosso: guardia superata da tests/v14835-pulsante-rimosso.test.mjs");
assert.match(kiosk, /addEventListener\(\s*["']click["']/, "kiosk: il pulsante non usa 'click' (gesto fidato)");
// v148.31: il pulsante SCHERMO e' stato rimosso su richiesta di Alice
assert.ok(true, "pulsante rimosso: guardia superata da tests/v14835-pulsante-rimosso.test.mjs");
// v148.31: il pulsante SCHERMO e' stato rimosso su richiesta di Alice
assert.ok(true, "pulsante rimosso: guardia superata da tests/v14835-pulsante-rimosso.test.mjs");
assert.match(html, /src\/fullscreen-kiosk\.js/, "index.html: modulo fullscreen non caricato");
assert.match(sw, /"\.\/src\/fullscreen-kiosk\.js"/, "service worker: il modulo non entra nella cache");

// 5) STATO SINCRONIZZATO. Uscendo dal fullscreen in qualunque modo (anche col
//    comando di Samsung) il pulsante e l'evento devono aggiornarsi.
assert.match(kiosk, /fullscreenchange/, "kiosk: manca fullscreenchange");
assert.match(kiosk, /webkitfullscreenchange/, "kiosk: manca webkitfullscreenchange");
assert.match(kiosk, /bd:fullscreenchange/, "kiosk: manca l'evento pubblico bd:fullscreenchange");

// 6) Il manifest resta "fullscreen": e' la leva v147.84 che nasconde la barra
//    di sistema della TWA. Nessuna regressione silenziosa su quel fronte.
assert.equal(manifest.display, "standalone", "manifest: con display fullscreen One UI 9 nasconde il manico del cover screen (v148.27)");

console.log(JSON.stringify({ ok: true, fullscreen: "v148.25 schermo-esterno" }));
