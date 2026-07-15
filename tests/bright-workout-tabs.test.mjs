import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>")).replace(/\s+initFirebase\(\);\s+render\(\);\s*$/, "");
const store = new Map();
const localStorage = { getItem:k=>store.get(k)??null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{} };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:element, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:""}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, window:null, globalThis:null };
context.window = context; context.globalThis = context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const session = currentTrainingContext().session;
  const exercise = session.exercises[0];
  const key = workoutExerciseKey(session, exercise);
  state.training.openExercise = key;
  const execution = exerciseHtml(exercise, 0, session);
  if (state.training.workoutView !== "tabs-compact") throw new Error("vista compatta non predefinita");
  if (!execution.includes("workout-tabs-compact") || !execution.includes("Esecuzione") || !execution.includes("Storico") || !execution.includes("Note")) throw new Error("tab compatte mancanti");
  if (!execution.includes("compact-set-row") || !execution.includes("data-set-kg")) throw new Error("serie compatte non modificabili");
  state.training.exerciseTabs[key] = "notes";
  const notes = exerciseHtml(exercise, 0, session);
  if (!notes.includes("Nota di oggi") || !notes.includes('data-tab="notes"')) throw new Error("tab note non funzionante");
  state.training.exerciseTabs[key] = "history";
  const history = exerciseHtml(exercise, 0, session);
  if (!history.includes("Progressioni carico")) throw new Error("tab storico non funzionante");
  return {ok:true, view:state.training.workoutView, tabs:3};
})()`, context);
console.log(JSON.stringify(result));
