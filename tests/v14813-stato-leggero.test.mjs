import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.20 · STATO LEGGERO ---
// Alice: "partiamo dall'alleggerire lo stato da 7 MB, così il salvataggio locale non
// finisce più in quota piena". Misure sulla sua app: totale 7,05 MB, di cui
// `programs` 6,22 MB (oltre metà erano schede ARCHIVIATE, con molte copie esatte) e
// `masterExerciseLibrary` 743 KB (catalogo DERIVATO, ricostruito al boot).
// Qui: potatura dei duplicati + catalogo fuori dallo snapshot + copia locale in IndexedDB.

const vmLibs = await Promise.all([
  "exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js",
  "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js",
  "coach-ai3-programming.js", "coach-studio.js", "plate-calculator.js"
].map((p) => fs.readFileSync(path.join(root, p), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const bootPart = mainJs.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + bootPart;

// localStorage che rifiuta TUTTO (telefono con la quota esaurita), IndexedDB condiviso
const storage = new Map();
let quotaAttiva = true; // interruttore: ON = la quota è piena (ogni scrittura locale fallisce)
let quotaErrors = 0;
const quotaError = () => { const error = new Error("QuotaExceededError"); error.name = "QuotaExceededError"; error.code = 22; return error; };
const localStorageFake = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => { if (quotaAttiva) { quotaErrors += 1; throw quotaError(); } storage.set(key, String(value)); },
  removeItem: (key) => storage.delete(key), key: (i) => Array.from(storage.keys())[i], get length() { return storage.size; }
};
function makeIndexedDb() {
  const stores = new Map();
  const db = {
    objectStoreNames: { contains: (name) => stores.has(name) },
    createObjectStore(name) { if (!stores.has(name)) stores.set(name, new Map()); return {}; },
    close() {},
    transaction(name) {
      if (!stores.has(name)) throw new Error("store assente: " + name);
      const store = stores.get(name);
      const tx = { error: null, oncomplete: null, onerror: null, onabort: null };
      const done = () => queueMicrotask(() => { if (typeof tx.oncomplete === "function") tx.oncomplete(); });
      const ok = (value) => { const request = { result: value, error: null }; queueMicrotask(() => { if (typeof request.onsuccess === "function") request.onsuccess(); }); return request; };
      tx.objectStore = () => ({
        put(row) { store.set(row.journalId, row); done(); return ok(undefined); },
        get(key) { return ok(store.get(key)); },
        getAll() { return ok(Array.from(store.values())); },
        delete(key) { store.delete(key); done(); return ok(undefined); }
      });
      return tx;
    }
  };
  return { stores, open() { const request = { result: db, error: null }; queueMicrotask(() => { if (typeof request.onupgradeneeded === "function") request.onupgradeneeded(); if (typeof request.onsuccess === "function") request.onsuccess(); }); return request; } };
}
const indexedDbFake = makeIndexedDb();
const drawing = new Proxy({}, { get(t, k) { if (k === "measureText") return () => ({ width: 10 }); return () => {}; }, set() { return true; } });
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, replaceChildren() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, getBoundingClientRect() { return { width: 320, height: 180 }; }, getContext() { return drawing; }, innerHTML: "", textContent: "", scrollTop: 0, scrollLeft: 0, width: 320, height: 180, value: "", checked: false, hidden: false };
const documentFake = { getElementById() { return { ...element }; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: { ...element }, documentElement: { ...element }, addEventListener() {}, hidden: false, visibilityState: "visible" };
function boot(label) {
  const context = {
    console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, queueMicrotask,
    localStorage: localStorageFake, sessionStorage: localStorageFake, document: documentFake, indexedDB: indexedDbFake,
    navigator: { onLine: false, userAgent: "node" }, location: { protocol: "https:", origin: "https://example.test", hash: "", reload() {} },
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {},
    caches: { open: async () => ({ put: async () => {}, match: async () => undefined }) }, Response: class { constructor(b) { this._body = String(b); } json() { return JSON.parse(this._body); } },
    setTimeout(fn, ms) { return globalThis.setTimeout(fn, Math.min(Number(ms) || 0, 10)); }, clearTimeout(id) { globalThis.clearTimeout(id); },
    requestAnimationFrame(fn) { if (typeof fn === "function") fn(); return 1; }, addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: true }; },
    window: null, globalThis: null
  };
  context.window = context; context.globalThis = context;
  vm.createContext(context);
  new vm.Script(script, { filename: label }).runInContext(context);
  return context;
}

const ctx = boot("v14832");
const esito = await vm.runInContext(`(async () => {
  const out = {};
  const scheda = (nome, nota, quando) => ({ code: "A", name: nome, updatedAt: quando, exercises: [{ name: "Hip_Thrust", progression: { weeks: [{ sets: "3", reps: "8", notes: nota }] } }] });

  // 1) potatura: via le copie ESATTE, restano tutte le versioni diverse
  const programma = { id: "p1", name: "Prova", sheets: [scheda("viva", "contenuto-vivo", "2026-10-01T00:00:00.000Z")], archivedSheets: [
    scheda("copia-del-vivo", "contenuto-vivo", "2026-09-01T00:00:00.000Z"),
    scheda("unica-vecchia", "contenuto-unico", "2026-08-01T00:00:00.000Z"),
    scheda("duplicato-antico", "contenuto-unico", "2026-07-01T00:00:00.000Z"),
    scheda("unica-nuova", "contenuto-diverso", "2026-09-20T00:00:00.000Z"),
    scheda("unica-nuova-bis", "contenuto-diverso", "2026-09-25T00:00:00.000Z")
  ] };
  const compattato = compactArchivedSheets([programma])[0];
  out.archiviatePrima = programma.archivedSheets.length;
  out.archiviateDopo = compattato.archivedSheets.length;
  out.tenute = compattato.archivedSheets.map((s) => s.name);
  out.vivaIntatta = compattato.sheets.length === 1 && compattato.sheets[0].name === "viva";

  // 2) lo snapshot locale non porta il catalogo di sistema, ma conserva i record di Alice
  const libreria = { version: 1, records: [
    { id: "sys-1", name: "Squat", provenance: { origin: "system" } },
    { id: "sys-2", name: "Panca", provenance: { origin: "system" } },
    { id: "mio-1", name: "Esercizio di Alice", provenance: { origin: "custom" } }
  ] };
  const snapshot = localStorageSnapshotFor({ programs: [programma], masterExerciseLibrary: libreria, meta: { updatedAt: "2026-10-12T00:00:00.000Z" } });
  out.recordNelloSnapshot = snapshot.masterExerciseLibrary.records.map((r) => r.id);
  out.catalogoRicostruibile = !!window.BarbellDivaMasterLibrary.resolve(libreria, "Squat");

  // 3) quanto si risparmia sullo snapshot locale con un catalogo grande
  const tantiRecord = Array.from({ length: 600 }, (_, i) => ({ id: "sys-" + i, name: "Esercizio " + i, provenance: { origin: "system" }, patterns: ["squat"], muscles: [{ role: "primary", name: "quadricipiti" }] }));
  const grande = { programs: [programma], masterExerciseLibrary: { records: [...tantiRecord, { id: "mio-1", name: "Mio", provenance: { origin: "custom" } }] }, meta: {} };
  out.bytePrima = JSON.stringify(grande).length;
  out.byteDopo = JSON.stringify(localStorageSnapshotFor(grande)).length;

  // 3-bis) la quota è DAVVERO piena: una scrittura locale fallisce
  let scrittureFallite = 0;
  try { localStorage.setItem("prova-quota", "x"); } catch (error) { scrittureFallite += 1; }
  return { ...out, scrittureFallite };
})()`, ctx);

// La quota si spegne FUORI dalla VM (dentro sarebbe una variabile della VM e il finto
// localStorage continuerebbe a lanciare): da qui guardo la copia locale su DISCO.
quotaAttiva = false;

const esito2 = await vm.runInContext(`(async () => {
  const out = {};
  // 4) copia locale durabile: con localStorage che rifiuta tutto, il disco la custodisce
  const statoNuovo = migrateStateSchema(clone(baseState));
  statoNuovo.meta = { ...(statoNuovo.meta || {}), updatedAt: "2026-10-12T08:00:00.000Z" };
  statoNuovo.profile = { ...(statoNuovo.profile || {}), account: { uid: "alice-test" } };
  statoNuovo.training = { ...(statoNuovo.training || {}), sessions: [{ id: "seduta-disco" }], activeWorkout: null };
  out.scrittaSulDisco = await persistLocalStateDurable(statoNuovo);
  const letto = await readLocalStateDurable();
  out.lettaDalDisco = !!letto && letto.state.training.sessions[0].id === "seduta-disco";

  // 5) idratazione: il localStorage è FERMO (più vecchio), il disco ha la versione buona
  state = migrateStateSchema(clone(baseState));
  state.profile = { ...(state.profile || {}), account: { uid: "alice-test" } };
  state.training = { ...(state.training || {}), sessions: [], activeWorkout: null };
  // il locale è CONGELATO nel passato: è il telefono che non riesce più a scrivere
  state.meta = { ...(state.meta || {}), updatedAt: "2026-10-11T08:00:00.000Z" };
  out.idratata = await hydrateFromLocalDurableSnapshot();
  out.sedutaArrivata = (state.training.sessions || []).some((s) => s.id === "seduta-disco");
  return out;
})()`, ctx);

assert.equal(esito.archiviatePrima, 5);
assert.equal(esito.archiviateDopo, 2, "devono restare solo le versioni DIVERSE (3 copie esatte in meno)");
assert.equal(JSON.stringify(esito.tenute.slice().sort()), JSON.stringify(["unica-nuova-bis", "unica-vecchia"]), "fra copie identiche resta la piu recente");
assert.equal(esito.vivaIntatta, true, "le schede vive non si toccano");
assert.equal(JSON.stringify(esito.recordNelloSnapshot), JSON.stringify(["mio-1"]), "nello snapshot locale restano solo i record di Alice");
assert.equal(esito.catalogoRicostruibile, true, "il catalogo di sistema è ricostruibile al boot");
assert.ok(esito.byteDopo < esito.bytePrima * 0.5, `lo snapshot deve dimezzarsi (prima ${esito.bytePrima}, dopo ${esito.byteDopo})`);
assert.equal(esito2.scrittaSulDisco, true, "la copia locale deve finire in IndexedDB anche con localStorage pieno");
assert.equal(esito2.lettaDalDisco, true, "la copia locale deve essere rileggibile");
assert.equal(esito2.idratata, true, "il boot deve idratare dal disco quando il localStorage è fermo");
assert.equal(esito2.sedutaArrivata, true, "i dati della copia durabile devono entrare nello stato");
assert.equal(esito.scrittureFallite, 1, "il test deve simulare davvero un localStorage pieno (QuotaExceededError)");

// --- guardie statiche -------------------------------------------------------
assert.match(mainJs, /function compactArchivedSheets\(programs = \[\]\)/);
assert.match(mainJs, /function compactStateForStorage\(targetState\)/);
assert.match(mainJs, /const proprie? = records\.filter\(\(record\) => record\?\.provenance\?\.origin !== "system"\)/);
assert.match(mainJs, /compactStateForStorage\(loaded\);/);
assert.match(mainJs, /compactStateForStorage\(merged\);/);
assert.match(mainJs, /async function persistLocalStateDurable\(snapshot = state\)/);
assert.match(mainJs, /async function hydrateFromLocalDurableSnapshot\(\)/);
// v148.20 · il disco si idrata DENTRO la corsa del boot (contratto v14759 intatto)
assert.match(mainJs, /async function hydrateFromCloudSnapshotCache\(\) \{\s*\n\s*\/\/ v148\.13[\s\S]{0,700}?await hydrateFromLocalDurableSnapshot\(\);/);
assert.match(mainJs, /Promise\.race\(\s*\[\s*hydrateFromCloudSnapshotCache\(\)\.catch\(\(\) => false\),\s*new Promise\(\(resolve\) => \{ setTimeout\(resolve, 400\); \}\)\s*\]\)\.then\(\(\) => \{ render\(\); \}\);/);
assert.match(mainJs, /indexedDB\.open\(WORKOUT_DB_NAME, 3\)/);

console.log(JSON.stringify({ ok: true, v: "v148.20", archiviatePrima: esito.archiviatePrima, archiviateDopo: esito.archiviateDopo, recordNelloSnapshot: esito.recordNelloSnapshot, bytePrima: esito.bytePrima, byteDopo: esito.byteDopo, copiaSulDisco: esito2.scrittaSulDisco, idratataDalDisco: esito2.idratata }));
