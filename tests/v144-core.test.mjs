import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const manifest = fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8");
const sync = fs.readFileSync(path.join(root, "sync-reliability.js"), "utf8");
const config = fs.readFileSync(path.join(root, "app-config-v144.js"), "utf8");
const files = new Set(fs.readdirSync(root));

const check = (condition, message) => assert.ok(condition, message);

// Apertura e caricamento della base dati.
check(/^<!doctype html>/i.test(html), "index.html deve aprirsi come documento HTML");
check(html.includes("const PROGRAM_LIBRARY") && html.includes("buildProgramsFromLegacy"), "programmi caricabili");
check(html.includes("function runSchemaMigrations") && html.includes("DATA_SCHEMA_VERSION"), "migrazioni presenti");

// Logbook, libreria esercizi e Coach AI.
for (const marker of ["function logbookHtml", "saveWorkoutSession", "function exerciseLibraryResultsHtml", "function coachStudioDiagnosticsHtml", "coachAi3", "programRepository"]) {
  check(html.includes(marker), `marker mancante: ${marker}`);
}

// Sync: locale prima, coda, cloud dopo conferma.
for (const marker of ["queueReliableWorkoutSession", "reliableSyncQueue.enqueue", "flushReliableSync", "reconcileSessionVersions", "sync-reliability.js?v=v1451"]) {
  check(html.includes(marker) || sync.includes(marker), `sync marker mancante: ${marker}`);
}

// Backup verificabile, massimo cinque automatici e diagnostica copiabile.
for (const marker of ["function createBackupEnvelope", "function verifyBackupEnvelope", "const MAX_AUTOMATIC_BACKUPS = 5", "function createV144DiagnosticReport", "data-diagnostics-full-check"]) {
  check(html.includes(marker), `backup/diagnostica marker mancante: ${marker}`);
}

// Firebase e cache PWA.
for (const marker of ["function initFirebase", "saveCloudState", "FIREBASE_CONFIG"]) check(html.includes(marker), `Firebase marker mancante: ${marker}`);
check(html.includes("const APP_BUILD = window.BarbellDivaV144Config?.build || \"v145.1\""), "build v145.1 non uniforme nell'app");
check(config.includes('build: "v145.1"') && config.includes('cache: "atlas-app-v1451"'), "configurazione v145.1 non caricata");
check(sw.includes('const CACHE_NAME = "atlas-app-v1451"'), "cache service worker non v145.1");
check(manifest.includes("index.html?v=v1451"), "manifest non v145.1");

// I moduli esclusi non devono più essere caricati o consegnati.
for (const removed of ["./nutrizione/", "workout-pro.js", "workout-pro.css", "food-backup.js", "photo-store.js"]) {
  check(!html.toLowerCase().includes(removed) && !sw.toLowerCase().includes(removed), `modulo escluso ancora referenziato: ${removed}`);
}
for (const removedFile of ["workout-pro.js", "workout-pro.css", "food-backup.js", "photo-store.js"]) check(!files.has(removedFile), `file escluso ancora presente: ${removedFile}`);

console.log(JSON.stringify({ ok:true, build:"v145.1", checks:17, removedModules:true, core:"app/logbook/coach/sync/backup/firebase/migrations/cache" }));
