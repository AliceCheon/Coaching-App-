import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>")).replace(/\s+initFirebase\(\);\s+render\(\);\s*$/, "");
const storage = new Map();
const localStorage = { getItem:k=>storage.get(k)??null, setItem:(k,v)=>storage.set(k,String(v)), removeItem:k=>storage.delete(k) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, closest(){return null}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{}, setAttribute(){}, innerHTML:"", textContent:"" };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:element, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:"",reload(){}}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, matchMedia(){return {matches:true}}, window:null, globalThis:null };
context.window=context; context.globalThis=context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const program=programRepository.getPrograms().find(item=>normalizeExerciseName(item.name+" "+item.phase).includes("intensifica"));
  if(!program) throw new Error("Programma Intensificazione non trovato");
  const sheets=programRepository.getSheets(program.id);
  const sheet=sheets.find(item=>normalizeExerciseName(item.code)==="d")||sheets.find(item=>normalizeExerciseName(item.code).startsWith("d"));
  if(!sheet) throw new Error("Scheda D Intensificazione non trovata");
  coachProgramUi.programId=program.id; coachProgramUi.sheetId=sheet.id; coachProgramUi.drafts.clear();
  const draft=activeCoachBuilder();
  if(!draft.rows.length) throw new Error("Scheda D senza esercizi");
  const failures=[]; const originalUpdateExercise=programRepository.updateExercise.bind(programRepository);
  programRepository.updateExercise=(...args)=>{const outcome=originalUpdateExercise(...args);if(!outcome.ok)failures.push(outcome.errors);return outcome;};
  const target=draft.rows[0]; const originalWeeks=JSON.stringify(programRepository.getExerciseById(program.id,sheet.id,target.id).progression.weeks);
  target.note=(target.note||"")+" test salvataggio"; markCoachDraftDirty(sheet.id,target.id);
  const recoveryKey=coachDraftRecoveryKey(program.id,sheet.id);
  if(!localStorage.getItem(recoveryKey)) throw new Error("Bozza di emergenza non creata");
  const ok=commitActiveCoachDraft({immediate:true,quiet:true});
  if(!ok) throw new Error("Modifica Scheda D non salvata: "+JSON.stringify(failures));
  const saved=programRepository.getExerciseById(program.id,sheet.id,target.id);
  if(!saved.note.includes("test salvataggio")) throw new Error("Nota non persistita");
  if(JSON.stringify(saved.progression.weeks)!==originalWeeks) throw new Error("Settimane alterate durante il salvataggio");
  const weekNumbers=saved.progression.weeks.map(item=>Number(item.week));
  if(new Set(weekNumbers).size!==weekNumbers.length) throw new Error("Settimane duplicate dopo la riparazione");
  if(weekNumbers.some((value,index)=>value!==index+1)) throw new Error("Ordine settimane non sequenziale");
  if(localStorage.getItem(recoveryKey)) throw new Error("Bozza di emergenza non rimossa dopo il salvataggio");
  return {ok:true,program:program.name,sheet:sheet.code,exercise:saved.name,rows:draft.rows.length};
})()`, context);

if (!/@media \(min-width: 981px\)[\s\S]*?\.phase4-exercise-table thead[\s\S]*?position:\s*sticky/.test(html)) throw new Error("Header desktop non fissato durante lo scorrimento");
if (!/\.builder-v24-scroll\s*\{[\s\S]*?max-height:\s*calc\(100dvh - 155px\)/.test(html)) throw new Error("Area editor priva di scorrimento verticale controllato");
console.log(JSON.stringify(result,null,2));
