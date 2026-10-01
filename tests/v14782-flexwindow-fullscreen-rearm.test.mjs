import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

// v147.82 — Sul cover screen (FlexWindow Z Flip) il tasto "dimensione app" di
// Samsung puo' ridimensionare la finestra e far uscire dal fullscreen: la fascia
// chiara attorno agli obiettivi torna. Percio' requestFullscreen() va (ri)armato
// ad ogni gesto, non una sola volta.

// 1) Il fullscreen esiste ancora e si sblocca il cutout.
assert.match(html, /requestFullscreen/, "manca requestFullscreen per il cutout");
assert.match(html, /document\.fullscreenElement/, "manca la guardia su fullscreenElement");

// 2) I listener del fullscreen NON sono più "once": il gesto successivo deve
//    far rientrare in fullscreen dopo un cambio di dimensione dal sistema.
assert.ok(
  !/requestFullscreen[\s\S]{0,400}once:\s*true/.test(html),
  "i listener del fullscreen sono ancora 'once: true'"
);
assert.match(html, /addEventListener\("pointerdown",\s*go,\s*\{\s*passive:\s*true\s*\}\)/, "pointerdown non persistente");
assert.match(html, /addEventListener\("touchstart",\s*go,\s*\{\s*passive:\s*true\s*\}\)/, "manca touchstart persistente");
assert.match(html, /addEventListener\("resize",\s*schedule\)/, "manca il rientro in fullscreen al resize");

// 3) La finestra cover screen è riconosciuta da altezza/larghezza, non dal solo
//    "standalone", così scatta anche se il display-mode non fosse quello atteso.
assert.match(html, /innerHeight\s*>\s*560/, "manca il limite di altezza del cover screen");
assert.match(html, /innerWidth\s*>\s*760/, "manca il limite di larghezza del cover screen");

console.log(JSON.stringify({ ok: true, flexwindow: "fullscreen riarmato ad ogni gesto" }));
