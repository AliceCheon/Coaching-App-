import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert.match(html, /!\["silent", "balanced", "diva"\]\.includes\(state\.ui\.divaBotPersonality\)/);
assert.match(html, /state\.ui\.divaBotPersonality = "balanced"/);
assert.match(html, /data-diva-bot-personality/);
assert.match(html, /data-diva-bot-bubbles/);
assert.match(html, /data-diva-bot-celebrations/);
assert.match(html, /data-diva-bot-sounds/);
assert.match(html, /function triggerDivaBotReaction\(eventName, context = \{\}\)/);
for (const eventName of ["workout_opened", "set_completed", "exercise_completed", "half_workout", "almost_finished", "workout_completed", "personal_record", "load_increased", "load_decreased", "performance_improved", "performance_declined", "rir_too_low", "rir_too_high", "recovery_warning", "idle_too_long", "coach_analysis_started", "coach_analysis_completed"]) {
  assert.match(html, new RegExp(`${eventName}:\\{ priority:`));
}
assert.match(html, /personality === "silent" \? 3 : personality === "diva" \? 14 : 8/);
assert.match(html, /set_completed:\{ priority:"low", cooldown:60000/);
assert.match(html, /load_increased:\{ priority:"low", cooldown:30000/);
assert.match(html, /recentMessageIds\.includes/);
assert.match(html, /function savedWorkoutPersonalRecordDetails/);
assert.match(html, /previous\.reps <= set\.reps/);
assert.match(html, /role="status" aria-live="polite"/);
assert.match(html, /if \(canBubble\) showWorkoutMascotBubble/);
assert.match(html, /else if \(highOrCritical\) showToast/);
assert.match(html, /divaBotPreferences\(\)\.celebrations/);
assert.match(html, /const APP_BUILD = "v106"/);
assert.match(serviceWorker, /const CACHE_NAME = "atlas-app-v106"/);
assert.doesNotMatch(html, /https:\/\/cdn\./);

console.log(JSON.stringify({ ok:true, personality:"balanced", eventLibrary:17, limits:[3,8,14], cooldowns:true, strictPr:true }));
