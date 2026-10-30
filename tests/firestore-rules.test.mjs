import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");

assert.match(rules, /match \/barbellDivaAccounts\/\{uid\}/, "manca la regola sul documento utente");
assert.match(rules, /match \/\{document=\*\*\}/, "mancano le sottoraccolte (regola wildcard)");
assert.match(rules, /request\.auth\.uid == uid/, "manca il controllo sull'uid proprietario");
assert.ok(!/allow\s+read,\s*write:\s*if\s+true/.test(rules), "non deve esistere accesso pubblico");
assert.ok(!/nutritionPhotos/.test(rules), "la raccolta nutrizione non deve comparire nelle regole");

console.log(JSON.stringify({ ok: true, rules: "documento utente + sottoraccolte wildcard, solo proprietario" }));
