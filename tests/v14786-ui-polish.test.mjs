import fs from "node:fs/promises";
import assert from "node:assert/strict";

// Fase 2 (v148.09) — UI POLISH: pulsanti, tab, card e pagine più curati.
// Anti-regressione: lo stile deve esistere e NON deve toccare le variabili
// dei due temi base (Midnight/Lavender Diva), che restano invariati.
const css = await fs.readFile(new URL("../coach-studio-inline.css", import.meta.url), "utf8");
const config = await fs.readFile(new URL("../app-config-v144.js", import.meta.url), "utf8");
const sw = await fs.readFile(new URL("../service-worker.js", import.meta.url), "utf8");

// Il blocco UI POLISH esiste con i suoi marker principali.
for (const marker of [
  "· UI POLISH",
  ".gold-button, .ghost-button, .danger-button {",
  ".gold-button:hover, .primary-button:hover",
  ".top-tab.active {",
  ".week-tab.active {",
  ".nav-button.active {",
  ".hero-title::before {",
  "prefers-reduced-motion: reduce",
]) {
  assert.ok(css.includes(marker), `manca marker UI Polish: ${marker}`);
}

// Nessuna nuova definizione di variabili tema introdotta dal blocco UI.
// (I temi base devono restare gli unici a definire --bg-main / --pink-primary ecc.)
assert.ok(!/UI POLISH[\s\S]*?--bg-main:/.test(css), "il blocco UI non deve ridefinire --bg-main");
assert.ok(css.includes("--bg-main:#070817"), "tema scuro invariato");
assert.ok(css.includes("--bg-main:#c9a9e8"), "tema chiaro invariato");
assert.ok(css.includes("Midnight Diva 2026"), "tema scuro presente");
assert.ok(css.includes("Lavender Diva 2026"), "tema chiaro presente");

// Il restyling card non usa pseudo-elementi generici (evita conflitti con
// account-card / workout-entry / score-card che già usano ::before/::after).
assert.ok(!/\.card::before/.test(css), "non aggiungere .card::before generico");
assert.ok(!/\.card::after/.test(css), "non aggiungere .card::after generico");

// Versione allineata.
assert.ok(config.includes('build: "v148.09-giro-automatico"'), "build non aggiornata");
assert.ok(config.includes('cache: "atlas-app-v14809-giro-automatico"'), "cache non aggiornata");
assert.ok(sw.includes('CACHE_NAME = "atlas-app-v14809-giro-automatico"'), "CACHE_NAME non aggiornata");

console.log(JSON.stringify({ ok: true, build: "v148.09-giro-automatico", polish: ["buttons", "tabs", "cards", "pages"], themesUntouched: true }));
