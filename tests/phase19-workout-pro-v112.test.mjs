import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const workout = fs.readFileSync(path.join(root, "workout-pro.js"), "utf8");
const css = fs.readFileSync(path.join(root, "workout-pro.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

test("build v114 Fase 19.2 and schema v5 are wired with cache busting", () => {
  assert.match(html, /APP_BUILD\s*=\s*"v114-phase19\.2"/);
  assert.match(html, /DATA_SCHEMA_VERSION\s*=\s*5/);
  assert.match(html, /workout-pro\.js\?v=v114-phase19\.2/);
  assert.match(sw, /atlas-app-v114-phase19\.2/);
});

test("DOM tests are isolated from Alice's real workout storage", () => {
  assert.match(workout, /const IS_TEST_MODE = new URLSearchParams\(location\.search\)\.has\("phase191test"\)/);
  assert.match(workout, /if\(IS_TEST_MODE\)\{if\(session\)/);
  assert.match(workout, /if\(IS_TEST_MODE\)return;/);
});

test("backup export downloads even when internal backup history is full", () => {
  assert.match(html, /const envelope = createBackupEnvelope\("manual"\); const saved = storeBackupEnvelope\(envelope\);[\s\S]{0,180}const downloaded = downloadBackupEnvelope\(envelope\)/);
  assert.match(html, /Backup scaricato e verificato/);
});

test("restoring a backup merges workouts instead of replacing the logbook", () => {
  assert.match(html, /if \(restoreAll\) \{[\s\S]{0,300}mergeUniqueSessions/);
  assert.match(html, /if \(selections\.logbook\) next\.training = \{ \.\.\.next\.training, sessions:mergeUniqueSessions/);
});

test("durable journal recovery reapplies the Scheda F date correction", () => {
  assert.match(html, /const correctedWorkoutFDates = correctAliceWorkoutF16Jul2026\(state\)/);
  assert.match(html, /recovered > 0 \|\| correctedWorkoutFDates > 0/);
});

test("Fase 19.1 dispatches four real renderers and preserves view state", () => {
  for (const token of ["renderWorkoutMode", "renderProMode", "renderCompactMode", "renderQuickMode", "renderFreeMode", "viewMode"])
    assert.ok(workout.includes(token), `missing ${token}`);
  for (const marker of ["wp19-pro-mode", "wp19-compact-mode", "wp19-quick-mode", "wp19-free-mode"])
    assert.ok(workout.includes(marker), `missing DOM marker ${marker}`);
  assert.match(workout, /view-mode-changed/);
  assert.match(workout, /next==="free"&&session\.mode!=="free"/);
});

test("Free mode has real exercise, set, ordering, grouping and empty-session mutations", () => {
  for (const action of ["free-save-exercise", "free-remove", "free-add-set", "free-remove-set", "free-move", "free-group-next", "free-empty"])
    assert.ok(workout.includes(`action==="${action}"`), `missing behavior ${action}`);
  assert.match(workout, /addedDuringSession:true/);
  assert.match(workout, /plannedOrder:null/);
});

test("overlay reuses Diva Bot state and keeps a dedicated persisted position", () => {
  assert.match(workout, /coachMascotHtml\("workout-floating"\)/);
  assert.match(workout, /triggerDivaBotReaction/);
  assert.match(workout, /workoutProMascotPosition/);
  assert.match(workout, /wp19BotPointer/);
  assert.match(css, /body\.wp19-open #workoutMascotLayer/);
  assert.match(css, /\.wp19-sheet-open \.wp19-mascot-anchor/);
  assert.match(css, /\.wp19-keyboard-open \.wp19-mascot-anchor/);
});

test("active workout is separate, journaled, resumable and finalized only on confirmation", () => {
  for (const token of [
    "activeWorkout", "JOURNAL_KEY", "restoreJournal", "Allenamento in corso trovato",
    "persistWorkoutSessionDurably", "SAFETY_KEY", "saveFinal", "workoutProSessionId"
  ]) assert.ok(workout.includes(token), `missing ${token}`);
  assert.ok(workout.indexOf("persistWorkoutSessionDurably(saved)") < workout.indexOf("state.training.activeWorkout=null"));
});

test("timers are timestamp based and exercise timer is separate", () => {
  assert.match(workout, /endsAt:Date\.now\(\)\+duration\*1000/);
  assert.match(workout, /Number\(timer\.endsAt\)-Date\.now\(\)/);
  assert.match(workout, /recoveryTimers:\{\},exerciseTimers:\{\}/);
  assert.match(workout, /type:"exercise"/);
});

test("warmups, groups and intensity techniques use explicit models", () => {
  assert.match(workout, /newSet\(exercise,index,"warmup"/);
  assert.match(workout, /restBetweenExercises:0,restBetweenRounds:90/);
  assert.match(workout, /parentSetId:set\.id,segments:/);
  for (const token of ["drop-set", "rest-pause", "amrap", "superset", "triset", "circuit"])
    assert.ok(workout.includes(token), `missing ${token}`);
});

test("permissions are opt-in and unsupported APIs are reported", () => {
  assert.match(workout, /Notification\.requestPermission\(\)/);
  assert.match(workout, /if\(!\("wakeLock" in navigator\)\)/);
  assert.ok(workout.includes("if(!SR)"));
  assert.ok(workout.includes("Controllo vocale non supportato"));
  assert.match(html, /wakeLockEnabled:\s*false/);
  assert.match(html, /voiceEnabled:\s*false/);
});

test("settings centralize robot, backup and sync controls", () => {
  assert.match(html, /function settingsHtml\(\)/);
  assert.match(html, /Diva Bot/);
  assert.match(html, /Protezione dati/);
  assert.match(html, /Account Google/);
  assert.match(html, /Apri Impostazioni/);
});

test("PC save error distinguishes local quota from successful cloud sync", () => {
  assert.match(html, /releaseStateWriteSpace/);
  assert.match(html, /Cloud sincronizzato · spazio locale insufficiente/);
  assert.match(html, /Spazio locale insufficiente/);
});

test("Scheda F correction targets only the confirmed 20 to 16 July record", () => {
  assert.match(html, /function correctAliceWorkoutF16Jul2026/);
  assert.match(html, /recordedDate !== "2026-07-20"/);
  assert.match(html, /session\.dateInput = "2026-07-16"/);
  assert.match(html, /session\.date = "16\/07\/2026"/);
});

test("Diva Bot stays fixed when a set checkbox redraws training", () => {
  assert.match(html, /is-dragging,.workout-mascot-anchor\.is-restoring \{ transition:none; \}/);
  assert.doesNotMatch(html, /focusin[\s\S]{0,180}\[data-set-done\]/);
  assert.match(html, /candidate\?\.matches\?\.\("\[data-set-done\]"\) \? null : candidate/);
});

test("mobile controls meet the minimum target and respect safe area", () => {
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media\s*\(max-width:\s*620px\)/);
});

test("external JavaScript parses", () => {
  assert.doesNotThrow(() => new Function(workout));
  assert.doesNotThrow(() => new Function(sw));
});
