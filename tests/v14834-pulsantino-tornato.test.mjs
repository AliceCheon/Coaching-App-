/* v148.34 — Il pulsantino SCHERMO e' TORNATO (richiesta di Alice).
   Con l'APK 1.3.0 a WebView propria il fullscreen vero funziona davvero
   (onShowCustomView nativo), quindi il comando in-app torna a schermo.
   Questa guardia ribalta la vecchia v14831-pulsante-rimosso. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const kiosk = fs.readFileSync("src/fullscreen-kiosk.js", "utf8");
const css = fs.readFileSync("coach-studio-inline.css", "utf8");
const main = fs.readFileSync("android-twa/app/src/main/java/com/barbelldiva/app/MainActivity.java", "utf8");
const manifest = fs.readFileSync("android-twa/app/src/main/AndroidManifest.xml", "utf8");
const gradle = fs.readFileSync("android-twa/app/build.gradle", "utf8");

test("il pulsante SCHERMO viene creato al boot", () => {
  assert.match(kiosk, /function makeButton\(\)/, "manca makeButton()");
  assert.match(kiosk, /b\.id = "bdFullscreenToggle"/, "manca l'id del pulsante");
  assert.match(kiosk, /label\.textContent = "SCHERMO"/, "manca l'etichetta SCHERMO");
  assert.match(kiosk, /function boot\(\) \{\s*makeButton\(\);\s*emit\(\);/, "boot() non disegna il pulsante");
  assert.match(kiosk, /openSheet\(\);\s*\}\);/, "il tocco non apre il pannello a tre scelte");
});

test("il pulsante e' vestito (cerchio grande in basso a destra)", () => {
  assert.match(css, /\.bd-fs-toggle\s*\{/, "CSS del pulsante assente");
  assert.match(css, /bottom: calc\(20px \+ env\(safe-area-inset-bottom/, "non sta in basso sopra i gesti");
  assert.match(css, /\.bd-fs-toggle\[data-state="native"\]/, "stato fullscreen vero non distinto");
  assert.match(css, /html\[data-theme="light"\] \.bd-fs-toggle/, "tema chiaro non coperto");
});

test("APK 1.3.0: WebView propria, niente TWA", () => {
  assert.ok(!/LauncherActivity/.test(main), "MainActivity e' ancora una TWA");
  assert.match(main, /extends Activity/, "MainActivity non e' un'activity nativa");
  assert.match(main, /onShowCustomView/, "il fullscreen della pagina non arriva al nativo");
  assert.match(main, /onHideCustomView/, "manca l'uscita dal fullscreen");
  assert.match(main, /applyImmersiveFullscreen/, "manca l'immersiva della finestra");
  assert.match(main, /setSupportMultipleWindows\(false\)/, "login: il popup non ricade sul redirect");
  assert.match(main, /replace\("; wv\)", "\)"\)/, "login: user-agent WebView non ripulito");
  assert.match(main, /setAcceptThirdPartyCookies/, "login: cookie di terze parti spenti");
  assert.match(main, /FLAG_KEEP_SCREEN_ON/, "keep-awake senza appoggio nativo");
  assert.match(main, /navigator,'wakeLock'/, "shim navigator.wakeLock assente");
  assert.match(main, /MediaStore\.Downloads/, "export backup non salva in Download");
  assert.ok(!/androidbrowserhelper/.test(manifest + gradle), "residui androidbrowserhelper");
  assert.match(manifest, /\.CrashActivity/, "CrashActivity non dichiarata");
  assert.match(gradle, /versionCode \d+/, "versionCode assente");
  assert.match(gradle, /androidx\.webkit:webkit/, "manca androidx.webkit");
});
