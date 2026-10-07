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
// FASE 3-ter — tutte le espressioni: doppio tocco + voce di menu.
assert.match(html, /const WORKOUT_MASCOT_SHOW_EXPRESSIONS = \["happy","celebrate","lifting","thinking","encouraging","warning","rest"\]/);
assert.match(html, /function showWorkoutMascotExpressionShow\(\)/);
assert.match(html, /data-workout-mascot-expressions/);
assert.match(html, /data-workout-mascot-reset/);
assert.match(html, /data-side="left"/);

console.log(JSON.stringify({ ok:true, floating:true, drag:true, freePosition:true, expressions:true, hide:true, singleRobot:true }));