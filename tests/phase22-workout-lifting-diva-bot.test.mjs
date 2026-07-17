import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert.match(html, /"lifting"/);
assert.match(html, /class="diva-bot-barbell"/);
assert.match(html, /@keyframes divaBotBarbellLift/);
assert.match(html, /coachMascotController\.weightTimer = setTimeout/);
assert.match(html, /setCoachMascotState\("lifting", \{ message, announce, duration:1750 \}\)/);
assert.match(html, /Brava, vai!/);
assert.match(html, /const APP_BUILD = "v102"/);
assert.match(serviceWorker, /const CACHE_NAME = "atlas-app-v102"/);

console.log(JSON.stringify({ ok:true, workoutReaction:true, barbellLift:true, build:"v102" }));
