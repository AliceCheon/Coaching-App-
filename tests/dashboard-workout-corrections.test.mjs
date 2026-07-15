import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"))
  .replace(/\s+initFirebase\(\);\s+render\(\);\s+importBundledNutritionBackup\(\);\s*$/, "");
const store = new Map();
const localStorage = { getItem:k=>store.get(k)??null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{} };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:element, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:""}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, window:null, globalThis:null };
context.window = context; context.globalThis = context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const latest = latestAppWorkout("Intensificazione");
  if (latest?.sessionCode !== "E6") throw new Error("ultimo allenamento E6 non riconosciuto");
  if (autoSessionCodeForDate(todayInput()) !== "F") throw new Error("prossima scheda non impostata su F");
  if (currentTrainingContext().session.code !== "F") throw new Error("dashboard non apre Scheda F");
  if (!dailyFace().includes("daily-face-svg") || !dailyFace().includes("<svg")) throw new Error("faccina SVG mancante");
  const dashboard = dashboardHtml();
  if (dashboard.includes('data-screen-target="volume"') || dashboard.includes('"Volume", stats.volume')) throw new Error("Volume ancora presente nella Home");
  const session = currentTrainingContext().session;
  const exercise = session.exercises[0];
  state.training.openExercise = workoutExerciseKey(session, exercise);
  const workout = exerciseHtml(exercise, 0, session);
  if (!workout.includes("data-set-done") || !workout.includes("aria-pressed")) throw new Error("spunta serie non cliccabile");
  const key = setDoneKey(currentTrainingContext(), exercise, 0);
  state.training.setDone[key] = true;
  if (!setIsDone(currentTrainingContext(), exercise, 0, "")) throw new Error("stato spunta non persistente");
  return {ok:true, latest:latest.sessionCode, next:currentTrainingContext().session.code, face:"svg", checkable:true};
})()`, context);
console.log(JSON.stringify(result));
