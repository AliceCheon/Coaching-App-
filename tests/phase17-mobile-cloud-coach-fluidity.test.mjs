import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>")).replace(/\s+initFirebase\(\);\s+render\(\);\s+importBundledNutritionBackup\(\);\s*$/, "");
const storage = new Map();
const localStorage = { getItem:k=>storage.get(k)??null, setItem:(k,v)=>storage.set(k,String(v)), removeItem:k=>storage.delete(k) };
const drawing = new Proxy({}, { get(target,key){ if(key==="measureText") return ()=>({width:10}); return ()=>{}; }, set(){return true;} });
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, closest(){return null}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{}, setAttribute(){}, getAttribute(name){return name==="height"?"180":name==="width"?"320":null}, getBoundingClientRect(){return {width:320,height:180}}, getContext(){return drawing}, innerHTML:"", textContent:"", scrollTop:0, scrollLeft:0, width:320, height:180 };
const document = { getElementById(){return {...element}}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:{...element}, documentElement:{...element}, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"https:",origin:"https://example.test",hash:"",reload(){}}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(fn,ms){ return globalThis.setTimeout(fn,Math.min(Number(ms)||0,20)); }, clearTimeout(id){globalThis.clearTimeout(id)}, requestAnimationFrame(fn){ if(typeof fn==="function") fn(); return 1; }, addEventListener(){}, removeEventListener(){}, matchMedia(){return {matches:true}}, window:null, globalThis:null };
context.window=context; context.globalThis=context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = await vm.runInContext(`(async()=>{
  const program=programRepository.getPrograms()[0]; const sheet=programRepository.getSheets(program.id)[0]; const exercise=programRepository.getExercises(program.id,sheet.id)[0];
  if(!exercise) throw new Error("Esercizio test non disponibile");
  let listener=null; let cloudPayload=null;
  const collections={nutritionPhotos:new Map()};
  const collectionFor=(name)=>({
    get:async()=>({forEach(fn){for(const [id,value] of collections[name].entries())fn({id,data:()=>value})}}),
    onSnapshot(){return()=>{}},
    doc(id){return {set:async(value)=>{collections[name].set(id,value);return true}}}
  });
  const doc={
    set:async(value)=>{cloudPayload={...(cloudPayload||{}),...value,state:{...(cloudPayload?.state||{}),...(value.state||{}),meta:{...(cloudPayload?.state?.meta||{}),...(value.state?.meta||{})}}};return true},
    get:async()=>({exists:false,data:()=>null}),
    collection:(name)=>collectionFor(name),
    onSnapshot:(next)=>{listener=next;return()=>{listener=null}}
  };
  cloudUser={uid:"alice-test"}; dbService={collection:()=>({doc:()=>doc})};
  state.profile.account={uid:"alice-test",syncReady:false,cloudStatus:"login"};
  const uploaded=await uploadThisDeviceToCloud();
  if(!uploaded||!cloudPayload?.state) throw new Error("Upload cloud non riuscito con backend valido");
  const programRecords=[...collections.nutritionPhotos.values()].filter(item=>item.program);
  if(programRecords.length!==state.programs.length) throw new Error("Programmi non separati nel cloud");
  if(JSON.stringify(cloudPayload.state).length>=900000) throw new Error("Documento cloud principale ancora troppo grande");
  if(typeof listener!=="function") throw new Error("Listener cloud automatico non avviato");
  const future="2099-01-01T12:00:00.000Z";
  const remoteProgramRecord=programRecords.find(item=>item.programId===program.id);
  const remoteExercise=remoteProgramRecord.program.sheets.find(s=>s.id===sheet.id).exercises.find(e=>e.id===exercise.id);
  remoteExercise.note="modifica arrivata dal PC"; remoteExercise.updatedAt=future;
  const loadedPrograms=await loadCloudPrograms(cloudPayload);
  const loadedExercise=loadedPrograms.find(p=>p.id===program.id).sheets.find(s=>s.id===sheet.id).exercises.find(e=>e.id===exercise.id);
  if(loadedExercise.note!=="modifica arrivata dal PC") throw new Error("Shard programma non letto");
  listener({exists:true,data:()=>({...cloudPayload,updatedAt:future,state:{...cloudPayload.state,meta:{...(cloudPayload.state.meta||{}),updatedAt:future}}})});
  for(let i=0;i<12;i+=1) await Promise.resolve();
  const received=programRepository.getExerciseById(program.id,sheet.id,exercise.id);
  if(received.note!=="modifica arrivata dal PC") throw new Error("Modifica remota non ricevuta automaticamente");
  const sectionBytes=Object.fromEntries(Object.entries(cloudPayload.state).map(([key,value])=>[key,JSON.stringify(value).length]));
  const programBytes=state.programs.map(item=>({name:item.name,bytes:JSON.stringify(item).length}));
  const lean=clone(state); lean.programs.forEach(p=>p.sheets.forEach(s=>s.exercises.forEach(e=>{if(e.metadata)delete e.metadata.technicalProfile;delete e.biomechanics;})));
  const exerciseSizes=state.programs.flatMap(p=>p.sheets.flatMap(s=>s.exercises.map(e=>({name:e.name,bytes:JSON.stringify(e).length,keys:Object.keys(e)})))).sort((a,b)=>b.bytes-a.bytes).slice(0,3);
  return {uploaded,received:received.note,stateBytes:JSON.stringify(state).length,cloudPayloadBytes:JSON.stringify(cloudPayload.state).length,leanBytes:JSON.stringify(lean).length,sectionBytes,programBytes,exerciseSizes};
})()`, context);

const navBlock = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || "";
for (const key of ["home","workout","progress","logbook","nutrition","quiz"]) if (!navBlock.includes(`data-bottom="${key}"`)) throw new Error(`Tab mobile mancante: ${key}`);
if (!html.includes("grid-template-columns: repeat(6, minmax(0, 1fr))")) throw new Error("Barra mobile non impostata a sei tab");
if (!html.includes('body[data-theme="light"] .builder-v24-table input')) throw new Error("Contrasto chiaro editor non esplicito");
if (!html.includes("captureCoachViewport") || !html.includes("restoreCoachViewport")) throw new Error("Posizione editor non preservata");
if (/\[data-week-grid-field\][\s\S]{0,1800}updateCoachSaveIndicator\("saved"\);\s*render\(\)/.test(html)) throw new Error("La griglia continua a ridisegnarsi dopo ogni cella");
console.log(JSON.stringify(result,null,2));
