import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));

// FlexWindow (cover screen del Galaxy Z Flip) — storia:
//  - v147.81: `orientation: portrait` + `fullscreen` nel manifest confinavano la
//    PWA nell'area sopra la fotocamera, lasciando una fascia chiara.
//  - v147.62/147.83: rimosso `fullscreen` dal manifest, risolto con
//    `requestFullscreen()` + canvas a tema.
//  - v147.84: installata come app Android (TWA), la striscetta in basso ERA la
//    barra di navigazione di sistema: la TWA resta in `standalone` (barra
//    visibile) finche' il manifest non chiede `fullscreen`. Le app native non
//    hanno la barra perche' vanno a tutto schermo. Ora il manifest chiede
//    `fullscreen` (con fallback `standalone`), cosi' la TWA nasconde la barra.
//    Il cutout e' gestito (SHORT_EDGES sul tema Android della TWA e
//    `requestFullscreen()` nella PWA), quindi niente fascia.
assert.equal(manifest.orientation, undefined, "il manifest non deve forzare orientation");
assert.equal(manifest.display, "fullscreen", "display deve essere fullscreen (TWA a tutto schermo, niente barra di sistema)");
assert.ok(
  (manifest.display_override || []).includes("fullscreen"),
  "display_override deve includere fullscreen"
);
assert.ok(
  (manifest.display_override || []).includes("standalone"),
  "display_override deve mantenere standalone come fallback"
);

console.log(JSON.stringify({ ok: true, manifest: "fullscreen (fallback standalone), senza orientation" }));
