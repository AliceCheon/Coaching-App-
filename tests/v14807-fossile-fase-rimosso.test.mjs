import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const app = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.07: il campo fossile profile.phase è RIMOSSO del tutto ---
// Richiesta Alice dopo il bug dell'intestazione ("Intensificazione" sopra,
// "Intensità Agosto-Ottobre" nella card): niente letture residue, niente
// default, e lo stato salvato lo perde al primo caricamento.

// 1. Il default di stato non contiene più la fase (restano phaseStart/phaseLength,
//    usati dalla derivazione delle settimane).
assert.doesNotMatch(app, /phase: "Intensificazione",\s*\n\s*phaseStart/);
assert.match(app, /phaseStart: "2026-06-04"/);
assert.match(app, /phaseLength: 8,/);

// 2. Nessun codice legge più profile.phase (nemmeno come fallback della migrazione
//    di manualPhase); i commenti storici restano ammessi.
assert.doesNotMatch(app, /target\.profile\?\.phase/);
assert.doesNotMatch(app, /state\.profile\?\.phase/);
assert.doesNotMatch(app, /state\.profile\.phase\b/);

// 3. La migrazione strappa il fossile da ogni stato esistente (locale, cloud, backup).
assert.match(app, /if \(migrated\.profile\) delete migrated\.profile\.phase;/);

// 4. La fase efficace resta l'unica fonte (helper v148.07 in uso).
assert.match(app, /function effectiveTrainingPhase\(\)/);
assert.match(app, /training: \["Workout del giorno", effectiveTrainingPhase\(\)\]/);

console.log(JSON.stringify({ ok: true, v: "v148.07", fossile: "profile.phase rimosso del tutto" }));
