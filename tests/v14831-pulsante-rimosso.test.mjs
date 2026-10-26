/* v148.31 — Il pulsante "SCHERMO" non esiste piu' e la banda bianca di sistema
   e' dipinta col colore dell'app. Guardie: nessun residuo del pulsante nel
   codice, e tema Android DARK con la sfumatura di contrasto disattivata. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const kiosk = fs.readFileSync("src/fullscreen-kiosk.js", "utf8");
const css = fs.readFileSync("coach-studio-inline.css", "utf8");
const res = "android-twa/app/src/main/res";

test("il pulsante SCHERMO e' stato eliminato davvero", () => {
  assert.ok(!kiosk.includes("bdFullscreenToggle"), "il JS crea ancora il pulsante");
  assert.ok(!/makeButton\s*\(/.test(kiosk.replace("function makeButton", "")), "makeButton viene ancora chiamata");
  assert.ok(!/\.bd-fs-toggle\s*\{/.test(css), "il CSS definisce ancora il pulsante");
});

test("il pannello a tre scelte resta disponibile via API", () => {
  assert.match(kiosk, /openSheet/, "API openSheet sparita");
  assert.match(kiosk, /BarbellDivaFullscreen/, "namespace API sparito");
});

test("tema Android scuro: niente banda bianca di sistema", () => {
  const v29 = fs.readFileSync(`${res}/values-v29/themes.xml`, "utf8");
  const v31 = fs.readFileSync(`${res}/values-v31/themes.xml`, "utf8");
  const base = fs.readFileSync(`${res}/values/themes.xml`, "utf8");
  assert.match(v29, /enforceNavigationBarContrast">false/, "manca la disattivazione della velatura chiara");
  assert.match(v29, /enforceStatusBarContrast">false/, "manca la velatura della status bar");
  assert.match(v31, /windowSplashScreenBackground">@color\/splashBackground/, "splash non scuro");
  assert.match(base, /navigationBarColor">@color\/colorPrimaryDark/, "barra di navigazione non dipinta");
  assert.match(base, /windowLightStatusBar">false/, "icone di sistema chiare su fondo scuro mancanti");
  assert.ok(!/shortEdges/.test(base + v29 + v31), "nessun ritaglio edge-to-edge residuo");
});
