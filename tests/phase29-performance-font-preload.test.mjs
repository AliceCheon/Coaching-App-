import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8") + "\n" + fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const inlineCss = fs.readFileSync(path.join(root, "coach-studio-inline.css"), "utf8");

// Test font preload
assert.match(html, /<link rel="preload" href="atlas-nunito-sans.ttf" as="font"/);
assert.match(html, /fetchpriority="high"/);

// Test versione aggiornata
assert.match(html, /const APP_BUILD = window\.BarbellDivaV144Config\?\.build/);

// Test service worker
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
assert.match(serviceWorker, /const CACHE_NAME = "atlas-app-v14728-workout-mascot"/);

console.log(JSON.stringify({ ok:true, fontPreload:true, versioning:true }));

