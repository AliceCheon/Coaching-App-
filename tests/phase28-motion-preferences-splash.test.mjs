import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

for (const token of ["body[data-animation-mode=\"full\"]", "body[data-animation-mode=\"reduced\"]", "body[data-animation-mode=\"off\"]", "body.reduced-glow", "function effectiveAnimationMode", "function triggerHaptic", "hasUserInteraction", "navigator.vibrate", "function finishPremiumBoot", "function markPremiumBootReady", "premiumBootSafetyTimer", "markPremiumBootReady();", "prefers-reduced-motion"]) assert.ok(html.includes(token), `manca ${token}`);
assert.match(html, /light:10, success:15, warning:\[15,30,15\], error:\[25,40,25\], pr:\[15,40,20\]/);
assert.match(html, /effectiveAnimationMode\(\) !== "full"/);
assert.match(html, /const remaining = Math\.max\(0, 600 - \(Date\.now\(\) - premiumBootStartedAt\)\)/);
assert.match(html, /setTimeout\(\(\) => \{ premiumBootReady = true; finishPremiumBoot\(\); \}, 1800\)/);
assert.match(html, /const APP_BUILD = "v107"/);
assert.match(serviceWorker, /const CACHE_NAME = "atlas-app-v107"/);
console.log(JSON.stringify({ok:true,modes:true,glow:true,haptic:true,bootManaged:true}));
