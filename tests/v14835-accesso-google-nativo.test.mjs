/* v148.35 — Accesso Google NATIVO nell'APK.
   In WebView la signInWithRedirect di Firebase muore sull'errore Firebase
   "missing initial state" (storage partizionato, screenshot di Alice del
   26/10). Nell'APK l'accesso lo fa Android (GoogleSignIn) e il sito completa
   con signInWithCredential. Il flusso web resta di riserva. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("src/app-main.js", "utf8");
const main = fs.readFileSync("android-twa/app/src/main/java/com/barbelldiva/app/MainActivity.java", "utf8");
const gradle = fs.readFileSync("android-twa/app/build.gradle", "utf8");

test("il sito usa il ponte nativo quando c'e'", () => {
  assert.match(app, /window\.BarbellDivaNative\.googleSignIn\(\)/, "il sito non chiama il ponte nativo");
  assert.match(app, /__bdGoogleResolve/, "manca il ritorno del token");
  assert.match(app, /signInWithCredential/, "manca il login col token");
  assert.match(app, /GoogleAuthProvider\.credential\(idToken\)/, "il token Google non diventa credenziale");
  assert.match(app, /natCode\.includes\("cancel"\)/, "l'annullamento non deve fare rumore");
});

test("l'APK chiede l'account a Android e riporta il token", () => {
  assert.match(main, /WEB_CLIENT_ID/, "manca il web client id");
  assert.match(main, /411536425865-77roh93f79srmsi56u3d2s2dtj08furo\.apps\.googleusercontent\.com/, "client id non impostato");
  assert.match(main, /requestIdToken\(WEB_CLIENT_ID\)/, "GoogleSignIn non chiede l'id token");
  assert.match(main, /REQ_GOOGLE_SIGN_IN = 4702/, "manca la richiesta di codice");
  assert.match(main, /__bdGoogleResolve&&window\.__bdGoogleResolve\(/, "il token non torna alla pagina");
  assert.match(main, /__bdGoogleReject&&window\.__bdGoogleReject\(new Error\('cancel'\)\)/, "l'annullamento non torna alla pagina");
  assert.match(gradle, /play-services-auth/, "manca la libreria GoogleSignIn");
  assert.match(gradle, /versionCode 17/, "versionCode non aggiornato");
  assert.match(gradle, /versionName "1\.3\.1"/, "versionName non aggiornato");
});
