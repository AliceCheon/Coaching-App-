import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

for (const token of ["--motion-fast", "--motion-normal", "--ease-premium", "--radius-medium", "--shadow-card", "--focus-ring", "premiumSplash", "Loading your empire", "prefers-reduced-motion", "screen-enter", "premium-pr-badge", "experienceSettingsHtml", "onboardingHtml"]) assert.match(html, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(html, /function convertLegacyBackupToEnvelope/);
assert.match(html, /createBackupEnvelope\("manual"\)/);
assert.match(html, /downloadBackupEnvelope\(envelope\)/);
assert.match(html, /function restoreProgramProgressions/);
assert.match(html, /Le statistiche verranno ricalcolate automaticamente dal Logbook/);
assert.match(html, /checkinsLabel/);
assert.match(html, /Spazio backup utilizzato/);
assert.match(html, /"pre-update":3/);
assert.match(html, /"pre-restore":5/);
assert.match(html, /const APP_BUILD = "v106"/);
assert.match(serviceWorker, /const CACHE_NAME = "atlas-app-v106"/);

console.log(JSON.stringify({ ok:true, legacyAdapter:true, selectiveProgressions:true, premiumMotion:true, splash:true, reducedMotion:true }));
