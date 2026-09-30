import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const config = read("app-config-v144.js");
const module_ = read("src/firebase-app-check.js");
const main = read("src/app-main.js");

assert.match(config, /appCheckSiteKey/, "app-config deve esporre appCheckSiteKey");
assert.match(config, /appCheckProvider/, "app-config deve esporre appCheckProvider");
assert.match(module_, /new providerClass\(siteKey\)/, "il provider App Check deve essere istanziato con la site key");
assert.match(module_, /options\.provider \|\| "v3"/, "il provider di default deve essere reCAPTCHA v3");
assert.match(module_, /if \(!siteKey\)/, "senza site key il modulo deve uscire senza attivare");
assert.match(main, /BarbellDivaAppCheck\?\.initializeAppCheck/, "initFirebase deve invocare initializeAppCheck");
assert.match(main, /appCheckSiteKey/, "initFirebase deve leggere appCheckSiteKey dalla config");

console.log(JSON.stringify({ ok: true, appCheck: "collegato e guidato da appCheckSiteKey" }));
