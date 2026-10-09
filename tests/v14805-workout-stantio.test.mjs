import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const app = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.10: workout in corso STANTIO chiuso in automatico ---
// Alice: "ogni volta che apro l'app da telefono e clicco workout si apre un
// workout in corso vecchio che non c'entra un cavolo": i tre punti che
// resuscitavano il vecchio (rescue al boot, merge cloud, stato caricato)
// devono ora scartare tutto ciò che non è aggiornato OGGI.

// 1. Riconoscimento workout stantio: status attivo + data diversa da oggi.
assert.match(app, /function activeWorkoutIsStale\(workout\)/);
assert.match(app, /!\["active", "paused"\]\.includes\(workout\.status\)/);
assert.match(app, /Date\.parse\(workout\.updatedAt \|\| workout\.startedAt \|\| workout\.createdAt \|\| ""\)/);

// 2. Chiusura automatica: azzera activeWorkout e ripulisce la rete di salvataggio.
assert.match(app, /function closeStaleActiveWorkout\(targetState\)/);
assert.match(app, /targetState\.training\.activeWorkout = null;/);
assert.match(app, /localStorage\.removeItem\(WORKOUT_ACTIVE_RESCUE_KEY\)/);

// 3. Rescue: non riporta in vita workout dei giorni scorsi.
assert.match(app, /if \(activeWorkoutIsStale\(resume\)\) \{\s*\n\s*try \{ localStorage\.removeItem\(WORKOUT_ACTIVE_RESCUE_KEY\); \} catch \(error\) \{\}\s*\n\s*return false;/);

// 4. Merge cloud: il vecchio non rientra dal sincronizzatore.
assert.match(app, /\/\/ v148\.05 · e nemmeno il merge cloud fa rientrare un workout stantio\s*\n\s*closeStaleActiveWorkout\(merged\);/);

// 5. Boot: dopo il restore dello stato, workout stantio = chiuso e stato ripersistito.
assert.match(app, /try \{ if \(closeStaleActiveWorkout\(state\)\) persistStateToLocalStorage\(state, \{ touch: false \}\); \} catch \(error\) \{\} \/\/ v148\.05/);

console.log(JSON.stringify({ ok: true, v: "v148.10", workoutStantio: "auto-chiuso" }));
