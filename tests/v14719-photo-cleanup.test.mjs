import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const config = fs.readFileSync(path.join(root, "app-config-v144.js"), "utf8");
const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

const check = (condition, message) => assert.ok(condition, message);

check(html.includes("cleanupV14719"), "flag cleanup una tantum mancante");
check(html.includes("redactPhotoListFallback(loaded.nutrition?.dashboard?.photos)"), "foto di stato non redatte al bootstrap");
check(html.includes("writeBackupHistory(historyCleanup)"), "cronologia backup non riscritta senza foto");
check(html.includes('"front", "back", "side"'), "chiavi foto front/back mancanti dall'elenco heavy");
check(config.includes('build: "v147.21-sync-boot-persist"'), "build non aggiornata alla v147.21-sync-boot-persist");
check(sw.includes("atlas-app-v14721-sync-boot-persist"), "cache PWA non allineata alla v147.21-sync-boot-persist");

console.log(JSON.stringify({ ok:true, build:"v147.21-sync-boot-persist", checks:6, fix:"photo cleanup one-shot front/back/side + history + cloud" }));