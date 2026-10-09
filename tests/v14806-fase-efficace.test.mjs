import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const app = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.07: l'intestazione del Workout usa la FASE EFFICACE, non il fossile ---
// Alice: "dice Intensificazione e sotto Intensità agosto ottobre, che succede?"
// Il sottotitolo leggeva `state.profile.phase` (mai più scritto: rimasto a
// "Intensificazione") mentre la card e la derivazione usano il programma attivo.

// 1. Helper unico per la fase efficace (programma attivo vince, manuale decide).
assert.match(app, /function effectiveTrainingPhase\(\)/);
assert.match(app, /state\.training\?\.contextMode === "manual"/);
assert.match(app, /state\.training\?\.manualPhase \|\| activePhase \|\| state\.training\?\.phaseFilter/);

// 2. currentTrainingContext non duplica più la logica: usa l'helper.
assert.match(app, /const phase = effectiveTrainingPhase\(\);/);

// 3. Il sottotitolo della schermata Workout NON legge più il fossile profile.phase.
assert.match(app, /training: \["Workout del giorno", effectiveTrainingPhase\(\)\]/);
assert.doesNotMatch(app, /training: \["Workout del giorno", state\.profile\.phase\]/);

console.log(JSON.stringify({ ok: true, v: "v148.07", intestazione: "fase efficace" }));
