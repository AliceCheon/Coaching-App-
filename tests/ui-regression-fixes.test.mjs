import fs from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js", "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js", "coach-ai3-programming.js", "coach-studio.js"].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
const prologue = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + prologue + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const storage = new Map();
const localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const defaultElement = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, remove() {}, focus() {} };
const document = { getElementById() { return defaultElement; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...defaultElement }; }, body: defaultElement, documentElement: defaultElement, addEventListener() {} };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {}, location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; }, addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null };
context.window = context; context.globalThis = context; vm.createContext(context); new vm.Script(script).runInContext(context);

test("preview changes preserve manual week values and save edited fields", () => {
  const result = vm.runInContext(`(() => {
    state=clone(baseState); state.programs=[]; state.training.sessions=[]; state.coach.progressionTemplates=[];
    const p=programRepository.createProgram({id:"ui-reg-p",name:"UI regression",durationWeeks:4,sheets:[]},{save:false}).value;
    const s=programRepository.createSheet(p.id,{id:"ui-reg-s",code:"A",name:"A"},{save:false}).value;
    const e=programRepository.createExercise(p.id,s.id,{id:"ui-reg-e",name:"Squat",prescription:{sets:3,reps:"8-12",rir:"2",rest:{seconds:90}}},{save:false}).value;
    coachProgramUi.programId=p.id; coachProgramUi.sheetId=s.id; coachProgramUi.modal="progression-editor";
    const manual={...generateProgressionWeeks(e,"maintenance",1)[0],sets:7,reps:parseReps("5-7"),notes:"manuale salvato",source:"manual",weekNumber:1};
    programRepository.updateExercise(p.id,s.id,e.id,{progression:{templateId:"maintenance",weeks:[manual],manualWeeks:[1]}},{save:false});
    coachProgramUi.modalData={exerciseId:e.id,sheetId:s.id,templateId:"maintenance",weeks:[manual]};
    const input=(value)=>({value,addEventListener(){}});
    const body={innerHTML:"",querySelectorAll(){return[];}};
    const template=input("double-progression"),duration=input("6");
    const summary={innerHTML:""};
    const host={querySelector(selector){return ({"#progressionTemplateId":template,"#progressionDuration":duration,"[data-progression-weeks-body]":body,"[data-progression-rule-summary]":summary})[selector]||null;}};
    updateProgressionPreviewInPlace(host);
    const preview=coachProgramUi.modalData.weeks;
    if(preview.length!==6||preview[0].sets!==7||preview[0].reps.label!=="5-7"||preview[0].notes!=="manuale salvato"||preview[0].source!=="manual")throw new Error("preview ha perso una settimana manuale");
    const inputEl={dataset:{progressionWeek:"0",progressionField:"sets"},value:"9",closest(){return {querySelector(){return {replaceChildren(){}};}};}};
    updateProgressionWeekFromInput(inputEl);
    const elements={progressionTemplateId:template,progressionDuration:duration,progressionApplyMode:input("empty-only")};
    document.getElementById=(id)=>elements[id]||null;
    saveCoachUiModal();
    const saved=programRepository.getExerciseById(p.id,s.id,e.id).progression;
    if(saved.weeks.length!==6||saved.weeks[0].sets!==9||saved.weeks[0].source!=="manual"||!saved.manualWeeks.includes(1))throw new Error("valore manuale non persistito");
    return {ok:true,previewWeeks:preview.length,manualWeek:saved.weeks[0].weekNumber,sets:saved.weeks[0].sets,template:saved.templateId};
  })()`, context);
  assert.equal(result.ok, true);
  assert.equal(result.sets, 9);
  assert.equal(result.template, "double-progression");
});

test("Coach AI storico esclude tombstone e bozze e rispetta userId noto", () => {
  const result = vm.runInContext(`(() => {
    state=clone(baseState); state.profile.account={uid:"athlete-a"}; state.training.sessions=[
      {id:"live",userId:"athlete-a",status:"completed",dateInput:"2026-09-28",exercises:[{name:"Squat",sets:[{kg:100,reps:5}]}]},
      {id:"deleted",userId:"athlete-a",status:"completed",deletedAt:"2026-09-29",exercises:[{name:"Squat",sets:[{kg:180,reps:2}]}]},
      {id:"draft",userId:"athlete-a",status:"draft",exercises:[{name:"Squat",sets:[{kg:200,reps:1}]}]},
      {id:"other-user",userId:"athlete-b",status:"completed",exercises:[{name:"Squat",sets:[{kg:300,reps:1}]}]}
    ];
    localStorage.setItem(WORKOUT_JOURNAL_KEY,JSON.stringify([
      {id:"journal-live",userId:"athlete-a",status:"completed",exercises:[{name:"Squat",sets:[{kg:105,reps:5}]}]},
      {id:"journal-deleted",userId:"athlete-a",deletedAt:"2026-09-29",exercises:[{name:"Squat",sets:[{kg:400,reps:1}]}]},
      {id:"journal-other",userId:"athlete-b",exercises:[{name:"Squat",sets:[{kg:500,reps:1}]}]}
    ]));
    coachAiJournalMemo={at:0,userId:"",rows:null};
    const journal=coachAiHistoryJournalRows();
    const history=coachAiExerciseHistory("Squat",journal);
    if(journal.length!==1||history.entries.length!==2||history.best.kg!==105)throw new Error("storico Coach AI non filtrato correttamente: "+JSON.stringify({journal:journal.length,entries:history.entries.length,best:history.best?.kg}));
    return {ok:true,journal:journal.length,history:history.entries.length,best:history.best.kg};
  })()`, context);
  assert.deepEqual({ ...result }, { ok: true, journal: 1, history: 2, best: 105 });
});

test("Coach AI non abbina omonimi con identità programma/scheda diversa", () => {
  const result=vm.runInContext(`(() => {
    const engine=window.BarbellDivaCoachAI2;
    const exercise={id:"exercise-a",name:"Squat",programId:"program-a",sheetId:"sheet-a",variantRole:"standard",masterRecord:null};
    return [
      engine.matchesExercise(exercise,{name:"Squat",sourceExerciseId:"exercise-b"},{programId:"program-a",sheetId:"sheet-a"}),
      engine.matchesExercise(exercise,{name:"Squat"},{programId:"program-b",sheetId:"sheet-a"}),
      engine.matchesExercise(exercise,{name:"Squat"},{programId:"program-a",sheetId:"sheet-b"}),
      engine.matchesExercise(exercise,{name:"Squat"},{programId:"program-a",sheetId:"sheet-a"})
    ];
  })()`,context);
  assert.deepEqual([...result],[false,false,false,true]);
});

test("archiviazione esercizi è filtrabile e ripristinabile", () => {
  const result=vm.runInContext(`(() => {
    state=clone(baseState);state.programs=[];state.training.sessions=[];
    const id=window.BarbellDivaMasterLibrary.stableId("custom","Esercizio archiviato test");
    state.masterExerciseLibrary=window.BarbellDivaMasterLibrary.upsert(state.masterExerciseLibrary,{id,name:"Esercizio archiviato test",origin:"custom",isCustom:true,status:"archived",primaryMuscles:["Glutei"]});
    invalidateTechnicalLibraryCache();
    coachProgramUi.labFilters={status:"archived"};coachProgramUi.labQuery="archiviato test";
    const visible=exerciseLabFilteredProfiles().some(item=>item.id===id&&item.status==="archived");
    const modal=technicalExerciseProfile(technicalExerciseLibrary(true).find(item=>item.id===id));
    const html=technicalProfileDetailHtml(modal);
    return {visible,restoreButton:html.includes('data-lab-restore="'+id+'"'),label:html.includes("ARCHIVIATO")};
  })()`,context);
  assert.deepEqual({...result},{visible:true,restoreButton:true,label:true});
});

test("modal portal remounts on type change; render guard schedules one trailing pass", () => {
  assert.match(appMain, /host\.dataset\.coachModalType === coachProgramUi\.modal/);
  assert.match(appMain, /host\.dataset\.coachModalType = coachProgramUi\.modal/);
  assert.match(appMain, /bindLocallyRenderedCoachModal\(\);/);
  assert.match(appMain, /openCoachModalLocally\("technical-exercise-edit", \{ exerciseId:"", addToSheet:true \}\)/);
  assert.match(appMain, /function claimLibraryAddAction\(button\)[\s\S]{0,180}button\.disabled = true/);
  assert.match(appMain,/function captureScreenEditingState[\s\S]{0,1400}data-builder-row-field/);
  assert.match(appMain,/function sharedExerciseNotePatch\([\s\S]{0,700}weekNumber<=count/);
  assert.match(appMain,/openCoachModalLocally\("technical-exercise-edit", \{ exerciseId:button\.dataset\.labEdit \}\)/);
  assert.match(appMain,/item\.status==="archived"\?`<button type="button" class="gold-button" data-lab-restore=/);
  assert.match(appMain, /__renderTrailingTimer === null[\s\S]{0,360}render\(true\)/);
  assert.match(appMain, /if \(!fromTrailing && __renderTrailingTimer !== null\)[\s\S]{0,120}clearTimeout\(__renderTrailingTimer\)/);
});
