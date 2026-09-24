// v147.57 — La banda bianca sul FlexWindow non era più (solo) un overflow:
// a 400x365 la pagina riempie già il viewport, ma l'area che il browser lascia
// scoperta sotto il documento (barre di sistema Samsung) mostrava il colore di
// default del canvas radice, che è BIANCO. `html` e `body` avevano background
// trasparente (solo gradienti con i bordi trasparenti), quindi il bianco del
// canvas trapelava in fondo.
//
// La fix dipinge lo sfondo del tema su `html`, così che la striscia scoperta
// sia del colore dell'app e non bianca, e sincronizza `html[data-theme]` con
// il tema scelto (prima del primo paint e ad ogni render).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const read = (p) => stripComments(fs.readFileSync(path.join(root, p), "utf8"));
const readRaw = (p) => fs.readFileSync(path.join(root, p), "utf8");

const html = readRaw("index.html");
const css = read("coach-studio-inline.css");
const appMain = readRaw("src/app-main.js");

// --- 1) La causa: prima della fix il canvas non era dipinto. ---------------
// `body` usa `var(--bg)` (colore di sfondo del tema), ma la sua immagine di
// sfondo ha bordi trasparenti: da sola non copre la striscia sotto il documento.
assert.match(
  css,
  /body\s*\{[^}]*background:[\s\S]*?var\(--bg\)/,
  "body deve continuare a usare var(--bg) come base dello sfondo"
);

// --- 2) Ora `html` ha uno sfondo di tema pieno (dark di default). ----------
const htmlRule = css.match(/(?:^|\})\s*html\s*\{([^}]*)\}/);
assert.ok(htmlRule, "coach-studio-inline.css deve avere una regola html {...}");
assert.match(htmlRule[1], /background\s*:/, "html deve avere un background dichiarato");
assert.match(
  htmlRule[1],
  /linear-gradient\(145deg,\s*#050612 0%,\s*#0b0b20 52%,\s*#080719 100%\)/,
  "html deve dipingere il gradiente scuro del tema (canvas mai bianco)"
);
assert.match(htmlRule[1], /background-attachment\s*:\s*fixed/, "lo sfondo del canvas deve essere fixed");

// --- 3) Il canvas segue anche il tema chiaro. ------------------------------
const lightRule = css.match(/html\[data-theme="light"\]\s*\{([^}]*)\}/);
assert.ok(lightRule, "serve una variante html[data-theme=light] per il canvas");
assert.match(lightRule[1], /linear-gradient\(135deg,\s*#a985d4/, "canvas chiaro = gradiente lavender");
assert.match(lightRule[1], /background-attachment\s*:\s*fixed/, "anche il canvas chiaro è fixed");

// --- 4) Il canvas è corretto già al primo paint (script inline in <head>). --
assert.match(
  html,
  /<script>[\s\S]*?alice-method-app\.v8[\s\S]*?d\.dataset\.theme\s*=\s*theme[\s\S]*?<\/script>/,
  "index.html deve impostare html[data-theme] prima del primo paint leggendo il tema salvato"
);

// --- 5) Il tema viene risincronizzato sul canvas ad ogni cambio/render. -----
assert.match(
  appMain,
  /document\.documentElement\.dataset\.theme\s*=\s*theme/,
  "syncThemeUi deve rispecchiare il tema su documentElement"
);
assert.match(
  appMain,
  /document\.documentElement\.dataset\.theme\s*=\s*document\.body\.dataset\.theme/,
  "render deve rispecchiare il tema su documentElement"
);

// --- 6) Il tema di default resta scuro (la banda era bianca su tema scuro). -
assert.match(appMain, /theme:\s*"dark"/, "il tema di default deve restare dark");

console.log(JSON.stringify({ ok: true, checks: 9, fix: "canvas del FlexWindow dipinto col tema: niente bianco sotto il documento" }));
