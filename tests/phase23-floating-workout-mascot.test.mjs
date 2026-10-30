import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8") + "\n" + fs.readFileSync(path.join(root, "coach-studio-inline.css"), "utf8") + "\n" + fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

assert.match(html, /class="training-screen-wrap"/);
assert.match(html, /id="workoutMascotLayer" class="workout-mascot-layer"/);
assert.match(html, /coachMascotHtml\("workout-floating"\)/);
assert.doesNotMatch(html, /workout-coach-strip/);
assert.match(html, /position:fixed; top:8px; right:8px; z-index:35/);
assert.match(html, /pointer-events:none/);
assert.match(html, /const WORKOUT_MASCOT_POSITIONS = new Set\(\["top-right", "middle-right", "bottom-right", "bottom-left"\]\)/);
assert.match(html, /function moveWorkoutMascot\(positionName/);
assert.match(html, /pointerdown/);
assert.match(html, /document\.removeEventListener\("pointermove", workoutMascotDragMove\)/);
assert.match(html, /state\.ui\.workoutMascotVisible/);
assert.match(html, /Mostra Diva Bot durante l'allenamento/);
assert.match(html, /function showWorkoutMascotBubble/);
assert.match(html, /if \(activeScreen === "training"\)/);
assert.match(html, /load_increased:\{ priority:"low", cooldown:30000/);
assert.match(html, /function triggerDivaBotReaction\(eventName, context = \{\}\)/);
assert.match(html, /prefers-reduced-motion:reduce/);
// FASE 3-ter — posizione libera (non più solo i 4 angoli).
assert.match(html, /function workoutMascotFreeBounds\(\)/);
assert.match(html, /function persistWorkoutMascotFree\(xPct, yPct/);
assert.match(html, /state\.ui\.workoutMascotXPct/);
assert.match(html, /state\.ui\.workoutMascotFree/);
assert.match(html, /originLeft/);
// FASE 3-ter-bis — le espressioni sono CONTESTUALI (in base a quello che scrivi)
// + "compagnia" lenta e discreta. Niente più "tutte le facce assieme".
assert.match(html, /const WORKOUT_MASCOT_COMPANIONSHIP = \[/);
assert.match(html, /function startWorkoutMascotCompanionship\(\)/);
assert.match(html, /function stopWorkoutMascotCompanionship\(\)/);
assert.match(html, /function reactWorkoutMascotCompanionship\(\)/);
assert.doesNotMatch(html, /WORKOUT_MASCOT_SHOW_EXPRESSIONS/);
assert.doesNotMatch(html, /showWorkoutMascotExpressionShow/);
assert.doesNotMatch(html, /data-workout-mascot-expressions/);
assert.match(html, /data-workout-mascot-reset/);
assert.match(html, /data-side="left"/);
// FASE 3-ter-bis — il menu si chiude: click fuori + tasto Esc.
assert.match(html, /menu.contains\(event.target\)/);
assert.match(html, /event.key === "Escape"/);

// FASE 3-ter-quater — drag/menu con DELEGAZIONE a livello documento (sopravvivono ai re-render).
assert.match(html, /function ensureWorkoutMascotDelegation\(\)/);
assert.match(html, /delegationBound/);
assert.match(html, /const fromMascot = \(event\) => event\.target\?\.closest\?\.\("#workoutMascotButton"\)/);
assert.match(html, /document\.addEventListener\("pointerdown", \(event\) => \{/);
assert.doesNotMatch(html, /layer\.dataset\.workoutMascotBound/);
assert.doesNotMatch(html, /menuOutsideBound/);
console.log(JSON.stringify({ ok:true, floating:true, drag:true, freePosition:true, companionship:true, contextualExpressions:true, menuClose:true, hide:true, singleRobot:true }));