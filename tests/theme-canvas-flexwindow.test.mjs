import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const html = read("index.html");
const css = read("coach-studio-inline.css");
const main = read("src/app-main.js");

// Canvas a tema: il root dipinge il colore del tema (niente fascia bianca).
assert.match(css, /html\s*\{[^}]*background-color:\s*#090918/, "il canvas html non dipinge lo sfondo scuro");
assert.match(css, /html\[data-theme="light"\]\s*\{[^}]*background-color/, "manca lo sfondo del canvas in tema chiaro");

// Pre-paint: il tema è applicato su <html> prima del primo render.
assert.match(html, /document\.documentElement\.dataset\.theme = theme/, "manca lo script di tema pre-paint");
assert.match(html, /localStorage\.getItem\("alice-method-app\.v8"\)/, "il pre-paint non legge lo stato salvato");

// Sincronizzazione runtime su <html>.
assert.match(main, /document\.documentElement\.dataset\.theme = theme/, "syncThemeUi non aggiorna data-theme su html");
assert.match(main, /document\.documentElement\.dataset\.theme = state\.profile\.theme \|\| "dark"/, "render() non aggiorna data-theme su html");

// Fullscreen solo su finestra cover screen stretta/bassa (FlexWindow).
// v147.83: NON si usa piu' `display-mode: standalone` come cancello (si
// auto-disattivava entrando in fullscreen); si esclude solo il browser normale.
assert.match(html, /src\/fullscreen-kiosk\.js/, "index.html non carica src/fullscreen-kiosk.js (fullscreen v148.25)");

console.log(JSON.stringify({ ok: true, theme: "canvas a tema + pre-paint + fullscreen cover-screen" }));
