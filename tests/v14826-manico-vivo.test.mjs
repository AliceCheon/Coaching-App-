import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const kiosk = read("src/fullscreen-kiosk.js");
const css = read("coach-studio-inline.css");
const html = read("index.html");

// v148.26 "manico-vivo" — con la v148.25 in fullscreen nativo (tondino rosa) il
// manico/la barretta di One UI sul cover screen non compariva piu'. Non era un
// guasto: il fullscreen nativo nasconde l'interfaccia di sistema, quindi si
// porta via anche il comando per ridimensionare la finestra. Le due cose sono
// incompatibili per definizione.

// 1) DEFAULT = NATIVE (v148.33). Alice ha superato per iscritto la regola
//    v148.26 ("forza il fullscreen ovunque", 26/10, due volte): il manico
//    che il vecchio default proteggeva non esiste piu' su One UI 9
//    (checkpoint 46). Il default nativo scatta solo senza preferenza;
//    "off" esplicito resta rispettato.
assert.match(
  kiosk.split("function pref()")[1].split("}")[0],
  /return "native";/,
  "pref(): il default non e' piu' 'native' (richiesta esplicita di Alice)"
);
assert.match(kiosk, /raw === "0"\) return "off"/, "l'off esplicito non e' piu' rispettato");

// 2) CICLO A TRE STATI: off -> fill -> native -> off. Mai intrappolato in native.
assert.match(kiosk, /if \(m === "off"\) return "fill";/, "il ciclo non parte da off verso fill");
assert.match(kiosk, /if \(m === "fill"\) return "native";/, "dal fill non si arriva al native");
assert.match(kiosk, /return "off";/, "dal native non si torna a off");
assert.match(kiosk, /function fill\(\)/, "manca la modalita' fill come stato pubblico");

// 3) AL BOOT NIENTE NATIVE. Solo fill; il native richiede la scelta esplicita.
assert.match(kiosk, /function applyBootMode\(\)[\s\S]*?if \(pref\(\) === "fill"\) applyFill\("boot"\)/, "applyBootMode non applica fill al boot");
assert.ok(
  !/applyBootMode[\s\S]{0,200}enter\(\)/.test(kiosk),
  "applyBootMode chiama enter(): al boot non si forza il fullscreen nativo"
);
// 3-bis) v148.33: armAuto TORNA, ma bene: UNA richiesta nativa per caricamento,
//    al primo gesto, solo installata (mai browser normale) e solo via enter()
//    (che gestisce da sola il ripiego su fill al rifiuto).
assert.match(kiosk.split("function armAuto()")[1], /autoAllowed\(\)/, "armAuto non rispetta i canceli (browser normale/installazione)");
assert.match(kiosk.split("function armAuto()")[1], /enter\(\)/, "armAuto non richiede piu' il fullscreen nativo al primo gesto");

// 4) USCITA DI SISTEMA => FILL, non off. Se One UI esce dal fullscreen la
//    finestra non deve restare dimezzata ne' perdere il riempimento.
assert.match(kiosk, /if \(!stillNative && pref\(\) === "native"\) \{[\s\S]*?setPref\("fill"\);[\s\S]*?applyFill\("system-exit"\)/, "l'uscita di sistema non riporta a fill");

// 5) RIFIUTO => FILL + TRACCIA. Mai un fallimento silenzioso.
assert.match(kiosk, /note\("reject", error\);[\s\S]*?setPref\("fill"\)/, "il rifiuto non ripiega su fill");

// 6) IL MANICO DIPENDE DAL SISTEMA: in fill non si chiama requestFullscreen.
assert.match(kiosk, /function fill\(\) \{\s*setPref\("fill"\);/, "fill() non registra la preferenza");
assert.ok(
  !/function fill\(\)[\s\S]{0,400}requestFullscreen/.test(kiosk),
  "fill() richiede il fullscreen nativo: il manico non sarebbe piu' vivo"
);
assert.match(css, /html\.bd-fill/, "CSS: manca html.bd-fill");

// 7) MIGRAZIONE dalle preferenze vecchie ("0"/"1") al nuovo vocabolario.
assert.match(kiosk, /if \(raw === "0"\) return "off";/, "migrazione '0' -> off assente");
assert.match(kiosk, /if \(raw === "1"\) return "fill";/, "migrazione '1' -> fill assente");

// 8) Il pulsante resta l'unico comando affidabile e il modulo resta caricato.
// v148.31: il pulsante SCHERMO e' stato rimosso su richiesta di Alice
assert.ok(true, "pulsante rimosso: guardia superata da tests/v14833-pulsante-rimosso.test.mjs");
assert.match(html, /src\/fullscreen-kiosk\.js/, "index.html: modulo non caricato");
assert.match(kiosk, /diagnostics/, "manca la diagnostica");

console.log(JSON.stringify({ ok: true, fullscreen: "v148.33 manico-vivo (contratto aggiornato: default nativo + auto al primo gesto, su richiesta di Alice)" }));
