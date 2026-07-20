import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert.match(html, /workout_saved_partial:\{ priority:"medium", cooldown:20000/);
assert.match(html, /Sessione salvata\. Potrai continuare da qui\./);
assert.match(html, /Salvato tutto\. La Diva può riprendere quando vuole\./);
assert.match(html, /const completion = workoutCompletionSnapshot\(context\);/);
assert.match(html, /completion\.totalSets > 0 && completion\.completedSets === completion\.totalSets/);
assert.match(html, /else triggerDivaBotReaction\("workout_saved_partial"\)/);
assert.match(html, /function compareAgainstAllHistory/);
assert.match(html, /exerciseHistory\(exercise, 999\)/);
assert.match(html, /function compareAgainstPreviousSession/);
assert.match(html, /improvedVsPrevious/);
assert.match(html, /declinedVsPrevious/);
assert.match(html, /personal_record:\$\{normalizeExerciseName\(exercise\.name\)\}:\$\{comparison\.metric\}/);
assert.match(html, /personalRecordValues/);
assert.match(html, /function divaBotRirReaction/);
assert.match(html, /delta <= -2/);
assert.match(html, /delta >= 2/);
assert.match(html, /state\.training\?\.actualRir\?\./);
assert.match(html, /data-diva-bot-setting="visible"/);
assert.match(html, /data-diva-bot-setting="personality"/);
assert.match(html, /function updateDivaBotPreference/);
assert.match(html, /const APP_BUILD = "v106"/);
assert.match(serviceWorker, /const CACHE_NAME = "atlas-app-v106"/);

console.log(JSON.stringify({ ok:true, partialSave:true, strictCompletion:true, distinctPr:true, rirGuarded:true, settingsSynced:true }));
