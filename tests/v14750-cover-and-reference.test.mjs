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

// ---- A · banda bianca: il documento è sempre scuro e usa l'altezza garantita
assert.match(css, /html\s*\{[^}]*background:\s*#090918\s*!important/, "manca lo sfondo scuro su html");
assert.match(css, /@media \(max-height: 430px\) and \(max-width: 560px\)[\s\S]{0,400}background:\s*#090918\s*!important/, "manca lo sfondo scuro nella fascia di copertina");
assert.match(css, /min-height:\s*100svh\s*!important/, "manca 100svh (altezza minima garantita)");
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
assert.equal(token, "v14750", `token di build inatteso: ${token}`);
assert.equal(new Set([...html.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].map((m) => m[1])).size, 1);
assert.ok([...html.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].every((m) => m[1] === token), "index.html non allineato");
assert.ok([...manifest.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].every((m) => m[1] === token), "manifest non allineato");
assert.equal(sw.match(/const CACHE_NAME = "([^"]+)"/)[1], config.match(/cache:\s*"([^"]+)"/)[1], "CACHE_NAME non allineato");

console.log(JSON.stringify({ ok: true, token, checks: 14 }, null, 2));
