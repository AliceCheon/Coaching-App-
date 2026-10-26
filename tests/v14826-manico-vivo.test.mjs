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

// 1) DEFAULT = FILL. L'app riempie il viewport via CSS, il sistema resta
//    intatto e il manico e' vivo. Il default non deve MAI essere "native".
assert.match(kiosk, /return "off";/, "la preferenza di default non e' 'off' (serve la finestra per il pulsantino)");
assert.ok(
  !/return\s+"native";/.test(kiosk.split("function pref()")[1].split("}")[0]),
  "pref(): il default e' tornato 'native' (manico Samsung spacciato)"
);

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
assert.ok(!/requestFullscreen\(\)/.test(kiosk.split("function armAuto()")[1].split("function")[0]), "armAuto richiede ancora il fullscreen automatico: nasconderebbe il pulsantino");

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
assert.match(kiosk, /bd-fs-toggle/, "manca il pulsante in-app");
assert.match(html, /src\/fullscreen-kiosk\.js/, "index.html: modulo non caricato");
assert.match(kiosk, /diagnostics/, "manca la diagnostica");

console.log(JSON.stringify({ ok: true, fullscreen: "v148.26 manico-vivo" }));
