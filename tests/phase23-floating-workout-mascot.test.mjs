import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(html, /class="training-screen-wrap"/);
assert.match(html, /id="workoutMascotLayer" class="workout-mascot-layer"/);
assert.match(html, /coachMascotHtml\("workout-floating"\)/);
assert.doesNotMatch(html, /workout-coach-strip/);
assert.match(html, /position:sticky; top:8px; z-index:35/);
assert.match(html, /pointer-events:none/);
assert.match(html, /const WORKOUT_MASCOT_POSITIONS = new Set\(\["top-right", "middle-right", "bottom-right", "bottom-left"\]\)/);
assert.match(html, /function moveWorkoutMascot\(positionName/);
assert.match(html, /pointerdown/);
assert.match(html, /document\.removeEventListener\("pointermove", workoutMascotDragMove\)/);
assert.match(html, /nearestWorkoutMascotPosition/);
assert.match(html, /\["bottom-right", "bottom-left", "top-right"\]/);
assert.match(html, /state\.ui\.workoutMascotVisible/);
assert.match(html, /Mostra Diva Bot durante l'allenamento/);
assert.match(html, /function showWorkoutMascotBubble/);
assert.match(html, /if \(activeScreen === "training"\)/);
assert.match(html, /load_increased:\{ priority:"low", cooldown:30000/);
assert.match(html, /function triggerDivaBotReaction\(eventName, context = \{\}\)/);
assert.match(html, /prefers-reduced-motion:reduce/);

console.log(JSON.stringify({ ok:true, floating:true, drag:true, mobileCycle:true, hide:true, singleRobot:true }));
