// v14750 · Verifica statica delle due correzioni (copertina Z Flip + anteprima atleta).
import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("..", import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), "utf8");
const css = read("coach-studio-inline.css");
const app = read("src/app-main.js");
const html = read("index.html");
const manifest = read("manifest.webmanifest");
const sw = read("service-worker.js");
const config = read("app-config-v144.js");

// ---- A · canvas del cover screen: il tema segue l'app (v147.57-v147.62).
// Nota: la v14750 forzava il documento SEMPRE scuro (#090918 !important anche
// su html). Era proprio quella forzatura a cancellare il tema chiaro "Lavender
// Diva" su ogni schermata; e' stata rimossa a favore del canvas a tema
// (v14757/v14759): fondo del tema su html + sincronizzazione di html[data-theme].
assert.match(css, /html\s*\{[^}]*linear-gradient\(145deg,\s*#050612/, "il canvas (html) deve dipingere il gradiente del tema");
assert.match(css, /html\[data-theme="light"\]\s*\{[^}]*linear-gradient\(135deg,\s*#a985d4/, "serve il canvas chiaro (Lavender Diva)");
assert.match(css, /env\(safe-area-inset-top/, "manca l'area sicura in alto");
assert.match(css, /\.bottom-nav\s*\{[^}]*env\(safe-area-inset-bottom/, "manca l'area sicura sulla barra inferiore");

// ---- B · anteprima atleta: schede apribili pilotate dallo stato + delega unica
assert.ok(!/coach-reference-sheet[^`]*<details/.test(app), "l'anteprima usa ancora <details> nativi");
assert.match(app, /data-studio-reference-sheet=/, "manca il comando di apertura scheda");
assert.match(app, /coachProgramUi\.referenceOpenSheetId/, "lo stato di apertura non è persistito");
assert.match(app, /addEventListener\("click", \(event\) => \{\s*const sheetButton = event\.target\.closest\?\.\("\[data-studio-reference-sheet\]"\)[\s\S]{0,300}event\.stopPropagation\(\)/, "manca la delega in capture con stopPropagation");
assert.match(app, /addEventListener\("change", \(event\) => \{\s*const programSelect = event\.target\.closest\?\.\("\[data-studio-reference-program\]"\)/, "manca la delega del selettore programma");
assert.match(app, /programs\.map\(\(item\)=>`<option value="\$\{escapeHtml\(item\.id\)\}/, "l'elenco programmi non copre tutti i programmi");

// ---- coerenza di versione
const build = config.match(/build:\s*"([^"]+)"/)?.[1];
const token = `v${build.match(/^v(\d+)\.(\d+)/)[1]}${build.match(/^v(\d+)\.(\d+)/)[2]}`;
assert.equal(token, "v14762", `token di build inatteso: ${token}`);
assert.equal(new Set([...html.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].map((m) => m[1])).size, 1);
assert.ok([...html.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].every((m) => m[1] === token), "index.html non allineato");
assert.ok([...manifest.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].every((m) => m[1] === token), "manifest non allineato");
assert.equal(sw.match(/const CACHE_NAME = "([^"]+)"/)[1], config.match(/cache:\s*"([^"]+)"/)[1], "CACHE_NAME non allineato");

console.log(JSON.stringify({ ok: true, token, checks: 14 }, null, 2));
