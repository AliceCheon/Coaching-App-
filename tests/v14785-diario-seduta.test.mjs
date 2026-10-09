// v147.85 — Fase 1: Diario di seduta (note, umore, energia, RPE percepito).
// Guardia anti-regressione: le funzioni del diario, i campi nel markup del
// logbook, gli event listener e gli stili devono restare presenti.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const appMain = read("src/app-main.js");
const css = read("coach-studio-inline.css");
const config = read("app-config-v144.js");
const sw = read("service-worker.js");

// 1) Funzioni del diario presenti
assert.match(appMain, /function journalHtml\(\)/, "manca journalHtml()");
assert.match(appMain, /function updateJournalEntry\(/, "manca updateJournalEntry()");
assert.match(appMain, /function journalEntryFor\(/, "manca journalEntryFor()");
assert.match(appMain, /function journalHasContent\(/, "manca journalHasContent()");
assert.match(appMain, /const JOURNAL_MOODS = \[/, "manca JOURNAL_MOODS");

// 2) Il diario è agganciato alla schermata Logbook
assert.match(appMain, /\$\{journalHtml\(\)\}/, "journalHtml() non è iniettato nel logbook");

// 3) Campi editabili + mood
assert.match(appMain, /data-journal-field="note"/, "manca il campo note");
assert.match(appMain, /data-journal-field="energy"/, "manca il campo energia");
assert.match(appMain, /data-journal-field="rpe"/, "manca il campo RPE");
assert.match(appMain, /data-journal-mood="\$\{mood\.value\}"/, "mancano i bottoni umore");

// 4) Listener presenti (change/input + click mood)
assert.match(appMain, /document\.querySelectorAll\("\[data-journal-field\]"\)/, "manca il bind dei campi diario");
assert.match(appMain, /document\.querySelectorAll\("\[data-journal-mood\]"\)/, "manca il bind degli umori");

// 5) Persistenza nello stato
assert.match(appMain, /state\.journal = next;/, "il diario non viene salvato nello stato");
assert.match(appMain, /saveState\(\);/, "il diario non chiama saveState");

// 6) Stili del diario (tema scuro + chiaro)
assert.match(css, /\.journal-card/, "mancano gli stili .journal-card");
assert.match(css, /\.journal-mood\.active/, "mancano gli stili del mood attivo");
assert.match(css, /html\[data-theme="light"\] \.journal-note/, "mancano gli stili chiari del diario");

// 7) Versione allineata alla build corrente
assert.ok(config.includes('build: "v148.04-torta-focus-muscoli"'), "build non aggiornata alla build corrente");
assert.match(sw, /const CACHE_NAME = "atlas-app-v14804-torta-focus-muscoli"/, "cache PWA non aggiornata alla build corrente");

console.log(JSON.stringify({ ok: true, fase: 1, feature: "diario-seduta", moods: 5, fields: ["note", "mood", "energy", "rpe"] }));
