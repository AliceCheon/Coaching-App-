import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));

// v147.70: sul FlexWindow (cover screen del Galaxy Z Flip) `orientation: portrait`
// e il `fullscreen` del manifest confinavano la PWA nell'area sopra la fotocamera,
// lasciando una fascia chiara. La finestra edge-to-edge non deve essere forzata.
assert.equal(manifest.orientation, undefined, "il manifest non deve forzare orientation");
assert.ok(!(manifest.display_override || []).includes("fullscreen"), "il manifest non deve richiedere fullscreen");
assert.equal(manifest.display, "standalone", "display deve restare standalone");

console.log(JSON.stringify({ ok: true, manifest: "standalone senza orientation/fullscreen" }));
