import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const keepAwakeSource = fs.readFileSync(path.join(root, "keep-awake-v14742.js"), "utf8");

// === 1) Nessun asset locale mancante =====================================
// Regressione trovata nel merge v14741-v14743: index.html caricava
// "keep-awake-v14742.js", ma il file non esisteva nel repository né in nessun
// commit → 404 a ogni avvio e funzione assente in produzione.
const localRefs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((ref) => ref && !/^(?:[a-z]+:|\/\/)/i.test(ref) && !ref.startsWith("#"))
  .map((ref) => ref.split("?")[0].split("#")[0])
  .filter(Boolean);
assert.ok(localRefs.length >= 10, "riferimenti locali non trovati in index.html");
const missingAssets = localRefs.filter((ref) => !fs.existsSync(path.join(root, ref)));
assert.deepEqual(missingAssets, [], `asset locali mancanti: ${missingAssets.join(", ")}`);

// === 2) Il service worker precarica ogni script di root dell'app ==========
assert.ok(serviceWorker.includes('"./keep-awake-v14742.js"'), "keep-awake non precaricato dal service worker");
for (const ref of localRefs.filter((ref) => ref.endsWith(".js") && !ref.includes("/"))) {
  assert.ok(serviceWorker.includes(`"./${ref}"`), `script di root non precaricato dall'APP_SHELL: ${ref}`);
}

// === 3) Comportamento del modulo Keep Awake ==============================
const STORAGE_KEY = "barbell-diva.keepAwake";
const flush = () => new Promise((resolve) => setImmediate(resolve));

function createWakeLock() {
  const locks = [];
  return {
    locks,
    async request(type) {
      const lock = {
        type,
        released: false,
        handlers: [],
        addEventListener(_type, handler) { this.handlers.push(handler); },
        async release() { this.released = true; this.handlers.forEach((handler) => handler()); }
      };
      locks.push(lock);
      return lock;
    }
  };
}

function createEnvironment({ wakeLock = null, visibilityState = "visible", stored = null } = {}) {
  const store = new Map();
  if (stored !== null) store.set(STORAGE_KEY, String(stored));
  const listeners = new Map();
  const doc = {
    visibilityState,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    }
  };
  const context = {
    console, Promise, Object, Number, String, Boolean, Error, JSON, Math, Date, Array, Map, Set, TextEncoder,
    document: doc,
    navigator: wakeLock ? { wakeLock } : {},
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key)
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  new vm.Script(keepAwakeSource, { filename: "keep-awake-v14742.js" }).runInContext(context);
  return {
    api: context.BarbellDivaKeepAwake,
    doc,
    store,
    fire(type) { (listeners.get(type) || []).forEach((handler) => handler({ type })); }
  };
}

// Browser senza Screen Wake Lock API: no-op silenzioso, API comunque esposta.
const bare = createEnvironment();
await flush();
assert.equal(bare.api.isSupported(), false, "wakeLock dichiarato supportato senza API");
assert.equal(await bare.api.activate(), false, "activate() non deve riuscire senza API");
assert.equal(bare.api.isActive(), false, "lock attivo senza API disponibile");

// Browser supportato e pagina visibile: il lock parte da solo (è lo scopo del file).
const lock = createWakeLock();
const env = createEnvironment({ wakeLock: lock });
await flush();
assert.equal(env.api.isSupported(), true);
assert.equal(env.api.isActive(), true, "lock non acquisito all'avvio");
assert.equal(lock.locks.length, 1, "richieste wakeLock inattese all'avvio");

// Pagina in background: il browser rilascia il lock e il modulo lo segue.
env.doc.visibilityState = "hidden";
env.fire("visibilitychange");
await flush();
assert.equal(lock.locks[0].released, true, "lock non rilasciato in background");
assert.equal(env.api.isActive(), false, "lock ancora attivo in background");

// Ritorno in primo piano: il lock viene richiesto di nuovo.
env.doc.visibilityState = "visible";
env.fire("visibilitychange");
await flush();
assert.equal(lock.locks.length, 2, "lock non riacquisito al ritorno in primo piano");
assert.equal(env.api.isActive(), true);


// Preferenza spenta: nessun lock, e la scelta viene ricordata.
const lock2 = createWakeLock();
const env2 = createEnvironment({ wakeLock: lock2, stored: "0" });
await flush();
assert.equal(env2.api.isEnabled(), false, "preferenza salvata ignorata");
assert.equal(lock2.locks.length, 0, "lock acquisito con preferenza spenta");
assert.equal(env2.api.isActive(), false);

// Riattivazione e spegnimento a runtime.
env2.api.setEnabled(true);
await flush();
assert.equal(env2.api.isEnabled(), true);
assert.equal(lock2.locks.length, 1, "lock non acquisito dopo setEnabled(true)");
env2.api.setEnabled(false);
await flush();
assert.equal(env2.api.isEnabled(), false);
assert.equal(env2.store.get(STORAGE_KEY), "0", "preferenza non salvata");
assert.equal(env2.api.isActive(), false, "lock ancora attivo dopo setEnabled(false)");

// Richiesta rifiutata dal browser (NotAllowedError): nessun crash, nessun lock.
const failing = createEnvironment({ wakeLock: { async request() { throw new Error("NotAllowedError"); } } });
await flush();
assert.equal(failing.api.isActive(), false);
assert.equal(await failing.api.activate(), false, "activate() deve fallire in modo silenzioso");

// Ambiente senza DOM (esecuzione Node/SSR): il modulo non deve lanciare.
const noDom = { console, Promise, Object, Number, String, Boolean, Error };
noDom.window = noDom;
noDom.globalThis = noDom;
vm.createContext(noDom);
assert.doesNotThrow(() => new vm.Script(keepAwakeSource).runInContext(noDom), "il modulo lancia senza DOM");
assert.equal(typeof noDom.BarbellDivaKeepAwake.setEnabled, "function", "API non esposta senza DOM");
assert.equal(noDom.BarbellDivaKeepAwake.isSupported(), false);

console.log(JSON.stringify({ ok:true, assetsChecked:localRefs.length, missingAssets:[], keepAwake:{ autoActivate:true, backgroundRelease:true, preference:STORAGE_KEY, noDomSafe:true } }));

