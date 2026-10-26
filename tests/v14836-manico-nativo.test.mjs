/* v148.36 — Il manico NATIVO e' tornato: niente piu' pallino SCHERMO.
   L'APK e' un'app nativa: One UI le concede il pulsantino di sistema del
   fullscreen (il traguardo del checkpoint 44, confermato da Alice il 26/10).
   Il comando web resta come API ma non disegna piu' nulla. Le guardie
   dell'APK vero (dalla v14834) restano tutte. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const kiosk = fs.readFileSync("src/fullscreen-kiosk.js", "utf8");
const css = fs.readFileSync("coach-studio-inline.css", "utf8");
const main = fs.readFileSync("android-twa/app/src/main/java/com/barbelldiva/app/MainActivity.java", "utf8");
const manifest = fs.readFileSync("android-twa/app/src/main/AndroidManifest.xml", "utf8");
const gradle = fs.readFileSync("android-twa/app/build.gradle", "utf8");

test("il pallino SCHERMO non disegna piu' nulla", () => {
  assert.ok(!kiosk.includes("bdFullscreenToggle"), "il JS crea ancora il pulsante");
  assert.ok(!/makeButton\(\)/.test(kiosk), "makeButton viene ancora chiamata");
  assert.ok(!/\.bd-fs-toggle\s*\{/.test(css), "il CSS veste ancora il pulsante");
  assert.match(kiosk, /function boot\(\) \{\s*emit\(\);/, "boot() non e' pulito");
});

test("le API dello schermo restano vive", () => {
  assert.match(kiosk, /openSheet/, "API openSheet sparita");
  assert.match(kiosk, /BarbellDivaFullscreen/, "namespace API sparito");
  assert.match(kiosk, /"Fullscreen vero"/, "manca la scelta fullscreen vero");
});

test("l'APK resta un app vera con WebView propria (guardie della v14834)", () => {
  assert.ok(!/LauncherActivity/.test(main), "MainActivity e' ancora una TWA");
  assert.match(main, /onShowCustomView/, "fullscreen della pagina non arriva al nativo");
  assert.match(main, /applyImmersiveFullscreen/, "manca l'immersiva della finestra");
  assert.match(main, /public void googleSignIn/, "ponte Google perso");
  assert.match(main, /public void setKeepAwake/, "ponte keep-awake perso");
  assert.ok(!/androidbrowserhelper/.test(manifest + gradle), "residui della libreria TWA");
  assert.match(gradle, /versionCode 17/, "versionCode inatteso");
  assert.match(gradle, /play-services-auth/, "manca GoogleSignIn");
});
