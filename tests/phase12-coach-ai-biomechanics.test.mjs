import fs from "node:fs/promises";
import vm from "node:vm";
const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>")).replace(/\s+initFirebase\(\);\s+render\(\);\s*$/, "");
const store = new Map();
const localStorage = { getItem:k=>store.get(k)??null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{} };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:element, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:""}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, window:null, globalThis:null };
context.window=context; context.globalThis=context; context.sourceHtml=html; vm.createContext(context); new vm.Script(script).runInContext(context);
const result = vm.runInContext(`(() => {
  const required = ["leg curl","leg extension","rdl","hip thrust","glute bridge","leg press","pendulum","lat machine","pullover","chest press","croci","abductor","adductor"];
  for (const name of required) { const p = biomechanicsForExercise(name); if (!p.jointActions?.length || !p.jointDemand || !p.confidence) throw new Error("profilo incompleto: " + name); }
  const rdl = biomechanicsForExercise("RDL bilanciere");
  if (rdl.jointDemand.lumbar !== 4 || rdl.lengthenedBias !== "high") throw new Error("profilo RDL non verificabile");
  const rating = contextualExerciseRating({ name:"Hip Thrust", biomechanics:biomechanicsForExercise("Hip Thrust") }, { goal:"glutei" });
  if (!rating.tier || !rating.factors.progression) throw new Error("rating contestuale non calcolato");
  if (!BIOMECHANICS_KNOWLEDGE_BASE.version || !BIOMECHANICS_KNOWLEDGE_BASE.reviewedBy) throw new Error("knowledge base non versionata");
  if (!sourceHtml.includes("missingFields") || !sourceHtml.includes("Dati ")) throw new Error("gestione dati mancanti assente");
  return {ok:true, version:BIOMECHANICS_KNOWLEDGE_BASE.version, exercises:Object.keys(BIOMECHANICS_KNOWLEDGE_BASE.exercises).length, tier:rating.tier};
})()`, context);
console.log(JSON.stringify(result,null,2));
