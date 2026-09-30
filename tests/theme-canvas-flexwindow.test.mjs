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

// Fullscreen solo su PWA installata e finestra stretta (cover screen).
assert.match(html, /display-mode: standalone/, "il requestFullscreen non è limitato alla PWA installata");
assert.match(html, /requestFullscreen/, "manca requestFullscreen per il cutout");

console.log(JSON.stringify({ ok: true, theme: "canvas a tema + pre-paint + fullscreen cover-screen" }));
