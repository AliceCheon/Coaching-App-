import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"))
  .replace(/\s+initFirebase\(\);\s+render\(\);\s+importBundledNutritionBackup\(\);\s*$/, "");
const store = new Map();
const localStorage = { getItem:key=>store.get(key)??null, setItem:(key,value)=>store.set(key,String(value)), removeItem:key=>store.delete(key) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{}, setAttribute(){}, focus(){this.focused=true}, getBoundingClientRect(){return {width:360}} };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:{...element,dataset:{}}, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:""}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, window:null, globalThis:null };
context.window=context; context.globalThis=context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const context = currentTrainingContext();
  const session = context.session;
  const exercise = session.exercises[0];
  const exerciseKey = workoutExerciseKey(session, exercise);
  const draftId = draftKey(context, exercise);
  const noteId = draftNoteKey(context, exercise);
  state.training.openExercise = exerciseKey;
  state.training.draft[draftId] = ["77", "82"];
  state.training.noteDraft[noteId] = "Nota accessibilità";
  state.training.exerciseTabs[exerciseKey] = "execution";

  const executionIds = workoutTabDomIds(exerciseKey, "execution");
  const historyIds = workoutTabDomIds(exerciseKey, "history");
  const notesIds = workoutTabDomIds(exerciseKey, "notes");
  const initial = exerciseHtml(exercise, 0, session);
  const tabRoles = initial.match(/role="tab"/g) || [];
  if (tabRoles.length !== 3) throw new Error("le tre tab non hanno role=tab");
  if (!initial.includes('id="' + executionIds.tabId + '"') || !initial.includes('aria-controls="' + executionIds.panelId + '"')) throw new Error("collegamento Esecuzione incompleto");
  if (!initial.includes('id="' + historyIds.tabId + '"') || !initial.includes('aria-selected="false"')) throw new Error("attributi Storico incompleti");
  if (!initial.includes('id="' + notesIds.tabId + '"')) throw new Error("ID Note mancante");
  if (!initial.includes('role="tabpanel" id="' + executionIds.panelId + '" aria-labelledby="' + executionIds.tabId + '"')) throw new Error("tabpanel Esecuzione non collegato");
  const selectedCount = (initial.match(/aria-selected="true"/g) || []).length;
  if (selectedCount !== 1) throw new Error("deve esistere una sola tab selezionata");

  const tablist = { querySelectorAll(){return tabs} };
  const makeTab = (tab, ids) => ({ dataset:{workoutTab:exerciseKey,tab}, id:ids.tabId, closest(){return tablist}, focus(){} });
  const tabs = [makeTab("execution",executionIds),makeTab("history",historyIds),makeTab("notes",notesIds)];
  const press = (key,button) => { const event={key,prevented:false,preventDefault(){this.prevented=true}}; const handled=handleWorkoutTabKeydown(event,button); if(!handled||!event.prevented) throw new Error("tasto non gestito: "+key); };

  press("ArrowRight",tabs[0]);
  if (state.training.exerciseTabs[exerciseKey] !== "history") throw new Error("Freccia destra non apre Storico");
  const historyMarkup = exerciseHtml(exercise,0,session);
  if (!historyMarkup.includes('id="' + historyIds.tabId + '" class="workout-compact-tab active"') || !historyMarkup.includes('role="tabpanel" id="' + historyIds.panelId + '"')) throw new Error("ARIA Storico non aggiornata");
  press("ArrowLeft",tabs[1]);
  if (state.training.exerciseTabs[exerciseKey] !== "execution") throw new Error("Freccia sinistra non torna a Esecuzione");
  press("End",tabs[0]);
  if (state.training.exerciseTabs[exerciseKey] !== "notes") throw new Error("End non apre Note");
  press("Home",tabs[2]);
  if (state.training.exerciseTabs[exerciseKey] !== "execution") throw new Error("Home non apre Esecuzione");
  press("Enter",tabs[1]);
  if (state.training.exerciseTabs[exerciseKey] !== "history") throw new Error("Enter non attiva Storico");
  press(" ",tabs[2]);
  if (state.training.exerciseTabs[exerciseKey] !== "notes") throw new Error("Spazio non attiva Note");
  if (state.training.draft[draftId][0] !== "77" || state.training.draft[draftId][1] !== "82" || state.training.noteDraft[noteId] !== "Nota accessibilità") throw new Error("dati workout persi cambiando tab");
  return {ok:true,tabs:3,keyboard:["ArrowRight","ArrowLeft","Home","End","Enter","Space"],draftPreserved:true,active:state.training.exerciseTabs[exerciseKey]};
})()`,context);

if (!html.includes("@media (prefers-reduced-motion: reduce)")) throw new Error("prefers-reduced-motion mancante");
if (!html.includes("animation-duration:.01ms !important") || !html.includes("transition-duration:.01ms !important")) throw new Error("riduzione animazioni incompleta");
if (!html.includes("button:focus-visible")) throw new Error("focus visibile non garantito");

console.log(JSON.stringify(result));
