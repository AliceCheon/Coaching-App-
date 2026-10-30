import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));

// FlexWindow (cover screen del Galaxy Z Flip) — storia:
//  - v147.81: `orientation: portrait` + `fullscreen` confinavano la PWA
//    nell'area sopra la fotocamera, lasciando una fascia chiara.
//  - v147.62/147.83: rimosso `fullscreen`, risolto con requestFullscreen().
//  - v147.84: `fullscreen` era tornato per nascondere la barra di sistema
//    della TWA.
//  - v148.27: **ritirato definitivamente**. One UI 9 ha rinnovato il cover
//    screen (home screen, app drawer, recenti): il manico/la barretta di
//    sistema e' diventato parte dell'interfaccia. Con `display: fullscreen`
//    One UI tiene l'app in fullscreen di SISTEMA, il manico NON compare piu'
//    e la striscia sotto resta il canvas bianco del WebView. Il fullscreen
//    del manifest e la Fullscreen API sono cose separate (MDN): nessun
//    `exitFullscreen()` poteva rimediare. Ora `standalone` + `minimal-ui`.
assert.equal(manifest.orientation, undefined, "il manifest non deve forzare orientation");
assert.equal(
  manifest.display,
  "standalone",
  "display deve essere standalone: con fullscreen One UI 9 nasconde il manico del cover screen"
);
assert.ok(
  !(manifest.display_override || []).includes("fullscreen"),
  "display_override non deve contenere fullscreen (fullscreen di sistema = manico assente)"
);
assert.ok(
  (manifest.display_override || []).includes("standalone"),
  "display_override deve includere standalone"
);
assert.equal(manifest.background_color, "#080817", "background_color invariato (splash): la barra bianca si cura nel CSS, non qui");

console.log(JSON.stringify({ ok: true, manifest: "fullscreen (fallback standalone), senza orientation" }));
