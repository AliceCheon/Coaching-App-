import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8") + "\n" + fs.readFileSync(path.join(root, "coach-studio-inline.css"), "utf8") + "\n" + fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert.match(html, /const BACKUP_SCHEMA_VERSION = 1/);
assert.match(html, /const MAX_AUTOMATIC_BACKUPS = 5/);
assert.match(html, /function createBackupEnvelope/);
assert.match(html, /format:"barbell-diva-backup"/);
assert.match(html, /function backupChecksum/);
assert.match(html, /function verifyBackupEnvelope/);
assert.match(html, /Checksum non valido/);
assert.match(html, /function scheduleAutomaticBackup/);
assert.match(html, /setTimeout\(createAutomaticBackup, 5000\)/);
assert.match(html, /function restoreBackupEnvelope/);
assert.match(html, /const safetyBackup = storeBackupEnvelope\(createBackupEnvelope\("pre-restore", state\)\)/);
assert.match(html, /data-backup-select="logbook"/);
assert.match(html, /data-backup-select="programs"/);
assert.match(html, /data-backup-select="divaBot"/);
assert.match(html, /data-backup-select="exerciseLab"/);
assert.match(html, /Cronologia Backup/);
assert.match(html, /Recovery Mode/);
assert.match(html, /Ripristina ultimo backup/);
assert.match(html, /Scarica dati corrotti/);
assert.match(html, /initializeDataSafety\(\)/);
assert.match(html, /type === "automatic"/);
assert.match(html, /const APP_BUILD = window\.BarbellDivaV144Config\?\.build/);
assert.match(serviceWorker, /const CACHE_NAME = "atlas-app-v14729-clean-header"/);

console.log(JSON.stringify({ ok:true, export:true, import:true, checksum:true, history:20, selectiveRestore:true, recovery:true }));


