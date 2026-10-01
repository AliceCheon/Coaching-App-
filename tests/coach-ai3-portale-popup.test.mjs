import fs from "node:fs/promises";
import vm from "node:vm";

// v147.81 · Il popup di Coach AI non deve chiudersi da solo.
//
// Sintomo (Alice): in scheda premo "Simula questa soluzione", il popup si apre e
// poi si chiude da solo (a volte la pagina "riavvia" un attimo).
//
// Causa: render() chiama renderCoachModalPortal() ad OGNI giro. Se nessun modale
// del Coach Editor è aperto (coachProgramUi.modal vuoto — il caso normale), quella
// funzione faceva `host.replaceChildren()` sull'INTERO #coachModalPortalHost,
// cancellando anche il popup di Coach AI (gestito da coachProgramUi.ai3Preview).
// Il render successivo non lo ricreava più (HTML dello schermo invariato) → popup
// chiuso e perso.
//
// Questo test mette un mock DOM nel portale e verifica che il popup sopravviva.

const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js", "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js", "coach-ai3-programming.js", "coach-studio.js"].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");

function makeNode(classes = []) {
  const node = {};
  const set = new Set(classes);
  node.parentNode = null;
  node.children = [];
  node.dataset = {};
  node.classList = { contains: (c) => set.has(c), add: (c) => set.add(c), remove: (c) => set.delete(c), toggle: (c, on) => (on ? set.add(c) : set.delete(c)) };
  node.querySelector = () => null;
  node.querySelectorAll = () => [];
  node.contains = (other) => { let c = other; while (c) { if (c === node) return true; c = c.parentNode; } return false; };
  node.append = (child) => { child.parentNode = node; node.children.push(child); };
  node.insertAdjacentHTML = () => {};
  node.remove = () => { const p = node.parentNode; if (!p) return; const i = p.children.indexOf(node); if (i >= 0) p.children.splice(i, 1); node.parentNode = null; };
  Object.defineProperty(node, "childElementCount", { get: () => node.children.length });
  return node;
}

const storage = new Map();
const localStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) };
const generic = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, append() {}, remove() {}, insertAdjacentHTML() {} };
const portalHost = makeNode();
const document = {
  getElementById(id) { return id === "coachModalPortalHost" ? portalHost : generic; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() { return makeNode(); },
  body: { ...generic, contains: () => true },
  documentElement: generic,
  addEventListener() {},
  activeElement: null,
};
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, localStorage, sessionStorage: localStorage, document, navigator: { onLine: true }, location: { protocol: "https:", origin: "https://example.test", hash: "", reload() {} }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; }, addEventListener() {}, removeEventListener() {}, window: null, globalThis: null };
context.window = context; context.globalThis = context;
vm.createContext(context);
new vm.Script(script).runInContext(context);

// Il popup di Coach AI è già montato nel portale.
const backdrop = makeNode(["coach-modal-backdrop", "ai3-backdrop", "ai3-applied-backdrop"]);
portalHost.append(backdrop);

vm.runInContext(`{
  activeScreen = "coach";
  coachProgramUi.modal = "";
  renderCoachModalPortal();
}`, context);

if (portalHost.children.length !== 1 || portalHost.children[0] !== backdrop) {
  throw new Error("renderCoachModalPortal ha rimosso il popup di Coach AI (si chiude da solo)");
}
if (context.coachProgramUi?.modalDiagnostics?.unmounts) {
  throw new Error("Il portale ha contato uno smontaggio pur non avendo modali del Coach Editor aperti");
}

// Un modale del Coach Editor (gestito da coachProgramUi.modal) resta invece governabile:
// il popup AI non deve essere toccato nemmeno quando cambia il tipo di modale.
vm.runInContext(`{
  coachProgramUi.modal = "";
  renderCoachModalPortal();
}`, context);
if (portalHost.children.length !== 1) throw new Error("Il popup di Coach AI deve restare l'unico figlio del portale");

// Guardia strutturale: mai più replaceChildren()/innerHTML= sull'intero portale.
const code = appMain.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
if (/renderCoachModalPortal[\s\S]{0,1200}host\.replaceChildren\(\)/.test(code)) throw new Error("renderCoachModalPortal torna a svuotare l'intero portale");
if (/renderCoachModalPortal[\s\S]{0,1600}host\.innerHTML\s*=/.test(code)) throw new Error("renderCoachModalPortal torna a sovrascrivere l'intero portale");
if (!appMain.includes("coachPortalOwnedChildren")) throw new Error("Manca la separazione tra modali del Coach Editor e popup di Coach AI");
if (!appMain.includes("!backdrop.contains(document.activeElement)")) throw new Error("Manca la guardia anti-rifocalizzazione del popup (causava micro riavvii)");

console.log("coach-ai3 portale: popup stabile");
