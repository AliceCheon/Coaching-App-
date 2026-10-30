import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const engineSrc = fs.readFileSync(path.join(root, "sync-reliability.js"), "utf8");

// --- v148.24 · LA CODA CHE RISORGE A OGNI AVVIO ---
// Alice: "le sedute in coda sono diventate zero ... quando ho riaperto l'app
// le sedute in coda sono tornate a 12".
//
// Radice: "questa seduta è sincronizzata?" era dedotto da session.syncStatus,
// un flag che vive DENTRO la seduta. Ma la seduta vive in due posti — il root
// state nel cloud e il documento della collezione sessions — scritti in momenti
// diversi. Il root state può portare una copia più vecchia con syncStatus
// "pending": al boot il merge la preferisce, e 12 sedute già scritte sul cloud
// tornano in coda. Al giro dopo si risincronizzano, si svuota, e al riavvio
// successivo risorgono: un ciclo senza fine.
//
// Fix: un registro separato (createConfirmedLedger) che dice "questo CONTENUTO
// (hash) è già sul cloud". L'hash ignora updatedAt/deviceId/revision, quindi è
// lo stesso su telefono e PC. Contenuto invariato = niente coda.
// Questo test fallisce sulla v148.23.

// ---------- 1. il registro, provato per davvero (non solo letto) ----------
const storage = (() => {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k), _map: map };
})();

const sandbox = {
  console, Date, Math, JSON, Map, Set, Object, Array, String, Number, Boolean, RegExp, Promise, Error, parseInt, parseFloat, isNaN, setTimeout, clearTimeout,
  window: { dispatchEvent() { return true; } },
  document: { documentElement: { dataset: {} } },
  CustomEvent: class { constructor(type) { this.type = type; } }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
new vm.Script(engineSrc.replace(/^export default .*$/gm, "").replace(/^export /gm, ""), { filename: "sync-reliability.js" }).runInContext(sandbox);
const engine = sandbox.window.BarbellDivaSyncEngine;

assert.ok(engine, "il motore deve esporsi su window.BarbellDivaSyncEngine");
assert.equal(typeof engine.createConfirmedLedger, "function", "il motore deve offrire createConfirmedLedger");
assert.match(engine.SYNC_ENGINE_VERSION, /^19\.4\./, `versione motore inattesa: ${engine.SYNC_ENGINE_VERSION}`);

const ledger = engine.createConfirmedLedger({ storage, key: "test.confirmed.v1" });
const base = { id: "sess-1", dateInput: "2026-10-24", sessionCode: "D", total: 42, startedAt: "2026-10-24T17:00:00.000Z", completedAt: "2026-10-24T18:00:00.000Z", createdAt: "2026-10-24T17:00:00.000Z" };
const session = engine.normalizeSyncSession(base, { deviceId: "phone" });
const hash = session.dataHash;

assert.equal(ledger.has("sess-1", hash), false, "prima della conferma il registro deve essere vuoto");
ledger.mark("sess-1", hash, 3);
assert.equal(ledger.has("sess-1", hash), true, "dopo la conferma la seduta risulta sul cloud");
assert.equal(ledger.has("sess-1", "sync-altrocontenuto"), false, "un contenuto diverso NON è confermato: deve tornare in coda");
assert.equal(storage.getItem("test.confirmed.v1") !== null, true, "il registro deve essere persistito, non solo in memoria");

// stesso contenuto, altro dispositivo/orario => stesso hash (è il punto del fix)
const sameOnPc = engine.normalizeSyncSession({ ...base, revision: 9, updatedAt: "2026-10-25T09:00:00.000Z" }, { deviceId: "pc" });
assert.equal(sameOnPc.dataHash, hash, "l'hash deve ignorare deviceId, revision e updatedAt");
assert.equal(ledger.has("sess-1", sameOnPc.dataHash), true, "la stessa seduta scritta dal PC deve risultare già confermata");

// il contenuto cambia davvero (nota nuova) => hash nuovo => da rimandare
const edited = { ...sameOnPc, note: "ho aggiunto una serie" };
edited.dataHash = engine.dataHash((() => { const copy = { ...edited }; for (const k of ["dataHash", "syncStatus", "cloudSyncedAt", "updatedAt", "deviceId", "userId", "revision"]) delete copy[k]; return copy; })());
assert.equal(ledger.has("sess-1", edited.dataHash), false, "una modifica vera deve rientrare in coda");

// il registro non deve crescere senza fine
const small = engine.createConfirmedLedger({ storage, key: "test.cap.v1", max: 3 });
for (let i = 0; i < 6; i += 1) small.mark(`s-${i}`, `h-${i}`, 1);
assert.equal(Object.keys(small.entries()).length, 3, "il registro deve restare limitato (max)");
assert.equal(small.has("s-5", "h-5"), true, "la potatura deve conservare le conferme più recenti");

// ---------- 2. l'app usa il registro in TUTTI i punti in cui decide di riaccodare ----------
const paths = [
  ["boot (initReliableSync)", /item\.syncStatus !== "synced" && !sessionConfirmedInCloud\(item\)\)\.forEach\(queueReliableWorkoutSession\)/],
  ["derivazione coda (pendingSessionOperations)", /session\.syncStatus === "synced" \|\| sessionConfirmedInCloud\(session\)\) return;/],
  ["accodamento esplicito (queueReliableWorkoutSession)", /if \(sessionConfirmedInCloud\(session\)\) return session;/],
];
for (const [label, re] of paths) {
  assert.match(mainJs, re, `v148.24: manca il controllo del registro in ${label} — la coda può risorgere`);
}

// il registro va scritto SOLO dopo una scrittura cloud riuscita
assert.match(mainJs, /await withTimeout\(ref\.set\([\s\S]{0,600}?40000\);\s*\n\s*confirmSessionInCloud\(payload\);/, "v148.24: la conferma va registrata dopo il set riuscito");
assert.match(mainJs, /createConfirmedLedger\(\{ storage:localStorage, key:`\$\{STORE_KEY\}\.sync-confirmed\.v1` \}\)/, "v148.24: il registro deve usare la localStorage della coda");
assert.match(mainJs, /function sessionConfirmedInCloud\(/, "v148.24: manca l'helper sessionConfirmedInCloud");

// ---------- 3. un conflitto vero non si ritenta a ogni giro ----------
// (ritentarlo lo faceva tornare "syncing" e poi di nuovo conflict, quindi il
// pulsante "Tieni la più recente" non compariva MAI nella card di Alice)
assert.match(mainJs, /existing\.status === "conflict" && String\(existing\?\.payload\?\.dataHash \|\| ""\) === String\(operation\.payload\?\.dataHash \|\| ""\)\) return;/,
  "v148.24: un conflitto irrisolto deve restare fermo in attesa della scelta, non essere ritentato");

console.log("v148.24 · coda che non risorge: registro dei confermati verificato");
