import fs from "node:fs/promises";
import assert from "node:assert/strict";

const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const serviceWorker = await fs.readFile(new URL("../service-worker.js", import.meta.url), "utf8");

for (const state of ["idle", "happy", "celebrate", "thinking", "encouraging", "warning", "rest"]) {
  assert.match(html, new RegExp(`(?:\\"|')${state}(?:\\"|')`), `stato ${state} presente`);
}
assert.match(html, /function setCoachMascotState\(stateName, options = \{\}\)/);
assert.match(html, /class="diva-bot"/);
assert.match(html, /diva-bot-antenna/);
assert.match(html, /diva-bot-head/);
assert.match(html, /diva-bot-face/);
assert.match(html, /diva-bot-body/);
assert.match(html, /diva-bot-arm-left/);
assert.match(html, /diva-bot-arm-right/);
assert.match(html, /aria-hidden="true"/);
assert.match(html, /aria-live="polite"/);
assert.match(html, /prefers-reduced-motion:reduce/);
assert.match(html, /data-dashboard-coach-open/);
assert.match(html, /openCoachModal\("coach-ai-confirm", \{ suggestion:first \}\)/);
assert.match(html, /serviceWorker\.register\(`\.\/service-worker\.js\?v=\$\{APP_BUILD\}`/);
assert.match(serviceWorker, /const CACHE_NAME = "atlas-app-v102"/);
assert.doesNotMatch(html, /6e2fab5e-6659-403b-9ac6-4c9ac2083406/);
assert.doesNotMatch(html, /C:\/Users\/AliceClemente\/Downloads/);
console.log(JSON.stringify({ ok:true, mascot:"Diva Bot", states:8, mobile:true, cache:"v102" }));
