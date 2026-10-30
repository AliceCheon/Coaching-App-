import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

assert.match(src, /LAST_ACCOUNT_UID_KEY/, "manca la chiave dell'ultimo account");
assert.match(src, /function isolateLocalStateForAccount\(uid\)/, "manca la funzione di isolamento");
assert.match(src, /isolateLocalStateForAccount\(user\.uid\)/, "l'isolamento non viene invocato al login");
assert.match(src, /lastUid !== uid/, "manca il confronto tra uid precedente e nuovo");
assert.match(src, /sync-queue\.v1/, "la coda di sync del vecchio account non viene azzerata");
assert.match(src, /state = clone\(baseState\)/, "lo stato in memoria non viene azzerato");

console.log(JSON.stringify({ ok: true, isolation: "account switch azzera lo stato locale prima del merge" }));
