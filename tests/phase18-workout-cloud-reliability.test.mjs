import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"))
  .replace(/\s+initFirebase\(\);\s+render\(\);\s+importBundledNutritionBackup\(\);\s*$/, "");

const storage = new Map();
let quota = Infinity;
const localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  removeItem: (key) => storage.delete(key),
  setItem(key, value) {
    const text = String(value);
    const used = [...storage.entries()].reduce((sum, [itemKey, itemValue]) => sum + (itemKey === key ? 0 : String(itemValue).length), 0);
    if (used + text.length > quota) {
      const error = new Error("QuotaExceededError: local storage quota exceeded");
      error.name = "QuotaExceededError";
      error.code = 22;
      throw error;
    }
    storage.set(key, text);
  }
};
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, closest(){return null}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{}, setAttribute(){}, getAttribute(){return null}, getBoundingClientRect(){return {width:320,height:180}}, innerHTML:"", textContent:"", disabled:false, scrollIntoView(){} };
const document = { getElementById(){return {...element}}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:{...element}, documentElement:{...element}, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"https:",origin:"https://example.test",hash:"",reload(){}}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(fn,ms){return globalThis.setTimeout(fn,Math.min(Number(ms)||0,10))}, clearTimeout(id){globalThis.clearTimeout(id)}, requestAnimationFrame(fn){if(typeof fn==="function")fn();return 1}, addEventListener(){}, removeEventListener(){}, matchMedia(){return {matches:true}}, window:null, globalThis:null };
context.__storage = storage;
context.__setQuota = (value) => { quota = value; };
context.window = context;
context.globalThis = context;
vm.createContext(context);
new vm.Script(script).runInContext(context);

const result = await vm.runInContext(`(async()=>{
  renderTrainingOnly=()=>{}; showToast=()=>{};
  state.training.date="2026-07-16";
  state.training.contextMode="auto";
  state.training.sessionName="auto";
  const workout=currentTrainingContext();
  if(workout.session.code!=="F") throw new Error("Dopo E non viene proposta la scheda F");
  if(workout.week!==6||workout.session.week!==6) throw new Error("La scheda F non mantiene la settimana 6 dello storico E6");
  const first=workout.session.exercises[0];
  const active=first.activeWeekPrescription;
  if(!active||Number(active.week)!==6) throw new Error("La scheda non usa la prescrizione della settimana 6");

  __storage.set(PRE_V55_BACKUP_KEY,"x".repeat(1600000));
  __storage.set(PRE_WEEK_CONSOLIDATION_BACKUP_KEY,"y".repeat(1600000));
  __setQuota(JSON.stringify(state).length+500000);
  const exercise=workout.session.exercises[0];
  state.training.draft[draftKey(workout,exercise)]=["42"];
  const saved=await saveWorkoutSession();
  if(!saved) throw new Error("Salvataggio F fallito dopo recupero spazio");
  if(__storage.has(PRE_V55_BACKUP_KEY)||__storage.has(PRE_WEEK_CONSOLIDATION_BACKUP_KEY)) throw new Error("Backup obsoleti non liberati al superamento quota");
  const session=state.training.sessions.find(item=>item.dateInput==="2026-07-16"&&item.sessionCode==="F");
  if(!session||session.week!==6) throw new Error("Sessione F6 non persistita");
  session.week=7;
  if(repairSequentialWorkoutWeeks(state)<1||session.week!==6) throw new Error("Una vecchia F7 non viene riparata in F6");
  const journal=JSON.parse(__storage.get(WORKOUT_JOURNAL_KEY)||"[]");
  if(!journal.some(item=>item.dateInput==="2026-07-16"&&item.sessionCode==="F")) throw new Error("Registro di emergenza F non scritto");
  state.training.sessions=state.training.sessions.filter(item=>item.id!==session.id);
  recoverWorkoutJournal(state);
  if(!state.training.sessions.some(item=>item.id===session.id)) throw new Error("F non recuperata dal registro di emergenza");
  const importedStatus=sessionCompletionState({source:"Backup Alice 14/07/2026",exercises:[{name:"Squat"}]});
  if(importedStatus.label!=="Registrato"||!importedStatus.completed) throw new Error("Seduta importata ancora classificata Bozza");

  __setQuota(Infinity);
  const programWrites=[]; let rootWrites=0;
  const records=new Map();
  const collection={
    doc(id){return {set:async(value)=>{programWrites.push(id);records.set(id,value)}}},
    get:async()=>({forEach(fn){for(const [id,value] of records)fn({id,data:()=>value})}}),
    onSnapshot(){return()=>{}}
  };
  const doc={set:async()=>{rootWrites+=1},get:async()=>({exists:false,data:()=>null}),collection:()=>collection,onSnapshot(){return()=>{}}};
  cloudUser={uid:"alice"}; dbService={collection:()=>({doc:()=>doc})}; state.profile.account={uid:"alice",syncReady:true,cloudStatus:"sync"};
  await saveCloudState();
  const initialProgramWrites=programWrites.length;
  state.training.feeling="alto";
  saveState({cloud:false,immediate:true});
  await saveCloudState();
  if(programWrites.length!==initialProgramWrites) throw new Error("Un allenamento riscrive ancora tutti i programmi cloud");
  const program=programRepository.getPrograms()[0]; const sheet=programRepository.getSheets(program.id)[0];
  programRepository.updateSheet(program.id,sheet.id,{note:"test sync mirato"},{cloud:false,immediate:true});
  await saveCloudState();
  if(programWrites.length!==initialProgramWrites+1) throw new Error("La modifica Coach non sincronizza solo il programma cambiato");
  return {week:workout.week,session:session.sessionCode,initialProgramWrites,programWrites:programWrites.length,rootWrites};
})()`, context);

if (!html.includes("Settimana ${context.week}")) throw new Error("Etichetta settimana dinamica mancante");
if (!html.includes("releaseObsoleteLocalBackups")) throw new Error("Recupero quota locale mancante");
if (!html.includes("changedPrograms.length")) throw new Error("Cloud programmi non incrementale");
if (!html.includes("atlas-v97-reload")) throw new Error("Cache v97 non impostata");
if (!html.includes("newlyMarkedSessions")) throw new Error("Le sessioni locali non vengono marcate dopo il cloud");
if (!html.includes('id="cloudOperationStatus"') || !html.includes('setCloudOperation("working"')) throw new Error("Indicatore sincronizzazione visibile mancante");
if (!html.includes('<details class="card danger-zone">') || !html.includes("requestClearAllData(clearData)")) throw new Error("Svuota dati non protetto");
if (!html.includes('WORKOUT_DB_NAME = "barbell-diva-workout-rescue"') || !html.includes("persistWorkoutSessionDurably")) throw new Error("Protezione IndexedDB del workout mancante");
if (!html.includes("weekFromLatestWorkout(date)")) throw new Error("Settimana automatica non derivata dallo storico reale");
if (!html.includes('APP_BUILD = "v97"') || !html.includes("repairSequentialWorkoutWeeks")) throw new Error("Build v97 o riparazione F7 mancante");
const cloudSaveBlock = html.match(/async function saveCloudState\(\)[\s\S]*?\n    }\n\n    async function loadCloudState/)?.[0] || "";
if (cloudSaveBlock.indexOf("await withTimeout(doc.set") > cloudSaveBlock.indexOf("saveCloudPrograms(clone(changedPrograms)")) throw new Error("Il cloud salva ancora le schede prima del logbook");
const downloadBlock = html.match(/async function downloadCloudToThisDevice\(\)[\s\S]*?\n    }/)?.[0] || "";
if (!downloadBlock.includes("await saveCloudState()")) throw new Error("Il download non rispedisce al cloud i dati locali uniti");
console.log(JSON.stringify(result, null, 2));
