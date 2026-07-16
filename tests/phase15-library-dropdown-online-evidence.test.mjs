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
  state=clone(baseState); state.programs=[]; state.training.sessions=[]; state.coach.exerciseLibrary=[];
  const library=technicalExerciseLibrary();
  const military=library.find(item=>normalizeExerciseName(item.name)==="military press");
  if(!military) throw new Error("Military press assente dalla Libreria");
  const row={id:"row-1",exercise:"Vecchio",group:"Spalle",sets:3,reps:"8-12",weeks:["3 x 10","3 x 9"],secondaryMuscles:"",cues:"",locked:false};
  const before=JSON.stringify({sets:row.sets,reps:row.reps,weeks:row.weeks});
  if(!applyTechnicalProfileToBuilderRow(row,military)) throw new Error("selezione profilo non applicata");
  if(row.exercise!==military.name||row.technicalProfileId!==military.id) throw new Error("ID Libreria non collegato");
  if(JSON.stringify({sets:row.sets,reps:row.reps,weeks:row.weeks})!==before) throw new Error("prescrizione o settimane alterate");
  const rowHtml=coachBuilderRowHtml(row,0);
  if(!rowHtml.includes("data-builder-exercise-profile")||!rowHtml.includes(military.id)) throw new Error("menu Libreria non renderizzato");
  if(rowHtml.includes('data-builder-row-field="exercise"')) throw new Error("campo testo esercizio ancora presente");
  if(!military.evidenceSources?.length||military.aiAnalysis.confidence==="low") throw new Error("fonti online non associate al profilo");
  const detail=technicalProfileDetailHtml(military);
  if(!detail.includes("Fonti consultate")||!detail.includes("pubmed.ncbi.nlm.nih.gov")||!detail.includes("acefitness.org")) throw new Error("fonti non visibili nel dettaglio");
  coachProgramUi.drafts.clear(); coachProgramUi.programId=""; coachProgramUi.sheetId="";
  const program=programRepository.createProgram({id:"dropdown-program",name:"Test tendina",durationWeeks:8,sheets:[]},{save:false}).value;
  const sheet=programRepository.createSheet(program.id,{id:"dropdown-sheet",code:"D",name:"Scheda D"},{save:false}).value;
  const originalWeeks=[{weekNumber:1,sets:3,reps:"8-10",rir:"2",prescribedLoad:{value:30,unit:"kg"}},{weekNumber:2,sets:3,reps:"8-10",rir:"1",prescribedLoad:{value:32.5,unit:"kg"}}];
  programRepository.createExercise(program.id,sheet.id,{id:"dropdown-exercise",name:"Arnold Press",muscle:"Spalle",prescription:{sets:3,reps:"8-10",rir:"2",rest:{seconds:120}},progression:{weeks:originalWeeks}},{save:false});
  coachProgramUi.programId=program.id; coachProgramUi.sheetId=sheet.id;
  const draft=activeCoachBuilder(); const draftRow=draft.rows.find(item=>item.id==="dropdown-exercise");
  const savedWeeksBefore=JSON.stringify(programRepository.getExerciseById(program.id,sheet.id,draftRow.id).progression.weeks);
  applyTechnicalProfileToBuilderRow(draftRow,military); markCoachDraftDirty(undefined,draftRow.id);
  if(!commitActiveCoachDraft({immediate:true,quiet:true})) throw new Error("salvataggio scelta Libreria fallito");
  const reopened=programRepository.getExerciseById(program.id,sheet.id,draftRow.id);
  if(reopened.name!==military.name||reopened.metadata?.technicalProfileId!==military.id) throw new Error("riapertura non conserva il profilo scelto");
  if(JSON.stringify(reopened.progression.weeks)!==savedWeeksBefore) throw new Error("salvataggio ha alterato le settimane");
  const counts=technicalProfileCounts();
  if(counts.complete<100) throw new Error("profili completi insufficienti: "+counts.complete);
  return {ok:true,counts,librarySize:library.length,selected:military.name,sources:military.evidenceSources.length};
})()`, context);

console.log(JSON.stringify(result,null,2));
