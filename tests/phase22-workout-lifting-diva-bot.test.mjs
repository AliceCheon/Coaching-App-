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
assert.match(html, /triggerDivaBotReaction\("load_increased", \{ exercise \}\)/);
assert.match(html, /load_increased:\{ priority:"low", cooldown:30000, state:"lifting", duration:1750 \}/);
assert.match(html, /Più peso\? Finalmente parliamo la stessa lingua\./);
assert.match(html, /const APP_BUILD = "v106"/);
assert.match(serviceWorker, /const CACHE_NAME = "atlas-app-v106"/);

console.log(JSON.stringify({ ok:true, workoutReaction:true, barbellLift:true, build:"v106" }));
