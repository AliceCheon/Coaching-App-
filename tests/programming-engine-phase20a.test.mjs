import test from "node:test";
import assert from "node:assert/strict";
import * as engine from "../programming-engine.js";

const progressionIds = [...engine.SUPPORTED_PROGRESSION_IDS];
const set = (load=60,reps=10,rir=2,extra={}) => ({ load,reps,rir,status:"completed",completed:true,...extra });
const program = (progressionId="double-progression", extra={}) => ({
  id:"p1",name:"Programma test",durationWeeks:6,status:"active",sheets:[{id:"w1",code:"A",name:"Scheda A",exercises:[{
    id:"ex1",name:"Squat bilanciere",equipment:"barbell",sets:3,reps:"8-10",rir:"2",rest:"120 sec",
    prescribedLoad:{value:60,unit:"kg"},progression:{templateId:progressionId,parameters:{increment:2.5}},...extra
  }]}]
});
const session = (day,load=60,reps=10,rir=2,extra={}) => ({
  id:`s${day}`,dateInput:`2026-07-${String(day).padStart(2,"0")}`,programId:"p1",sheetId:"w1",sessionCode:"A",week:day,
  status:"completed",source:"Workout Pro",readinessSnapshot:{score:8},sessionRpe:7,
  exercises:[{sourceExerciseId:"ex1",name:"Squat bilanciere",equipment:"barbell",plannedOrder:0,actualOrder:0,
    completedSets:[set(load,reps,rir),set(load,reps,rir),set(load,reps,rir)]}],...extra
});
const data = (loads=[60,62.5,65], options={}) => ({programs:[program(options.progressionId,options.exercise)],sessions:loads.map((load,index)=>session(index+1,load,options.reps??10,options.rir??2,options.session?.(index)||{})),metrics:{weight:66}});
const analysis = (input=data(), options={}) => engine.analyzeExerciseProgress(input,"ex1",options);

test("01 exports version 20A.1",()=>assert.equal(engine.PROGRAMMING_ENGINE_VERSION,"20A.1"));
test("02 stable stringify is key-order deterministic",()=>assert.equal(engine.stableStringify({b:1,a:2}),engine.stableStringify({a:2,b:1})));
test("03 hash is deterministic",()=>assert.equal(engine.hashProgrammingData({a:1}),engine.hashProgrammingData({a:1})));
test("04 different inputs have different hashes",()=>assert.notEqual(engine.hashProgrammingData({a:1}),engine.hashProgrammingData({a:2})));
test("05 normalization does not mutate source",()=>{const input=data();const before=structuredClone(input);engine.normalizeProgrammingData(input);assert.deepEqual(input,before);});
test("06 sessions are chronological",()=>{const input=data();input.sessions.reverse();assert.deepEqual(engine.normalizeProgrammingData(input).sessions.map(x=>x.id),["s1","s2","s3"]);});
test("07 original references survive normalization",()=>assert.equal(engine.normalizeProgrammingData(data()).sessions[0].exercises[0].sourceRef.exerciseId,"ex1"));
test("08 warmups are excluded",()=>{const input=data();input.sessions[0].exercises[0].warmupSets=[set(20,10,5)];const ex=engine.normalizeProgrammingData(input).sessions[0].exercises[0];assert.equal(ex.sets[0].analysisEligible,false);});
test("09 drop sets remain separate and excluded",()=>{const input=data();input.sessions[0].exercises[0].completedSets.push(set(30,15,0,{technique:"drop-set"}));const ex=engine.normalizeProgrammingData(input).sessions[0].exercises[0];assert.equal(ex.sets.at(-1).kind,"drop-set");assert.equal(ex.sets.at(-1).analysisEligible,false);});
test("10 top sets remain eligible",()=>{const input=data();input.sessions[0].exercises[0].completedSets=[set(70,6,1,{technique:"top-set"})];assert.equal(engine.normalizeProgrammingData(input).sessions[0].exercises[0].sets[0].analysisEligible,true);});
test("11 skipped sets are excluded",()=>{const input=data();input.sessions[0].exercises[0].completedSets=[set(60,10,2,{skipped:true})];assert.equal(engine.normalizeProgrammingData(input).sessions[0].exercises[0].sets[0].analysisEligible,false);});
test("12 legacy setValues normalize",()=>{const input=data();input.sessions[0].exercises[0]={name:"Squat bilanciere",sourceExerciseId:"ex1",setValues:["50","55"],reps:"8 10"};assert.equal(engine.normalizeProgrammingData(input).sessions[0].exercises[0].sets.length,2);});
test("13 identical exercises have high comparability",()=>{const ex=engine.normalizeProgrammingData(data()).sessions[0].exercises[0];assert.equal(engine.calculateComparability(ex,ex).level,"high");});
test("14 equipment mismatch reduces comparability",()=>{const ex=engine.normalizeProgrammingData(data()).sessions[0].exercises[0];assert.ok(engine.calculateComparability(ex,{...ex,equipment:"machine"}).score<1);});
test("15 adherence is bounded",()=>{const n=engine.normalizeProgrammingData(data());const ex=n.sessions[0].exercises[0];const score=engine.calculateAdherence(ex,ex.prescription,n.sessions[0]).score;assert.ok(score>=0&&score<=1);});
test("16 complete prescription produces high adherence",()=>{const n=engine.normalizeProgrammingData(data());const ex=n.sessions[0].exercises[0];const result=engine.calculateAdherence(ex,ex.prescription,n.sessions[0]);assert.ok(result.score>=.85,JSON.stringify(result));});
test("17 confidence is low with no points",()=>assert.equal(engine.calculateConfidence({points:[]}).confidenceLevel,"low"));
test("18 confidence is bounded",()=>assert.ok(engine.calculateConfidence({points:[{},{}]}).confidenceScore<=1));
test("19 no history is insufficient",()=>assert.equal(engine.analyzeExerciseProgress({programs:[program()],sessions:[]},"ex1").code,"insufficientData"));
test("20 one session is insufficient",()=>assert.equal(analysis(data([60])).code,"insufficientData"));
test("21 repeated improvement is recognized",()=>assert.equal(analysis(data([60,62.5,65])).code,"improvementStable"));
test("22 occasional improvement is recognized",()=>assert.equal(analysis(data([60,66,63])).code,"improvementOccasional"));
test("23 stable performance is recognized",()=>assert.equal(analysis(data([60,60])).code,"stable"));
test("24 isolated contextual regression is not a trend",()=>{const points=[{e1rm:100,sessionId:"a"},{e1rm:92,sessionId:"b",hasPain:true}];assert.equal(engine.detectRegression(points).code,"normalVariability");});
test("25 repeated regression is probable",()=>{const points=[100,95,90,85].map((e1rm,i)=>({e1rm,sessionId:`s${i}`}));assert.equal(engine.detectRegression(points).code,"probableRegression");});
test("26 plateau needs at least three points",()=>assert.equal(engine.detectPlateau([{e1rm:100},{e1rm:100}]).code,"insufficientData"));
test("27 five adherent flat sessions yield probable plateau",()=>{const points=Array.from({length:5},(_,i)=>({e1rm:100,sessionId:`s${i}`,rir:2,readiness:8,hasPain:false,incomplete:false,comparableSetCount:3,adherence:{score:.95}}));assert.equal(engine.detectPlateau(points).code,"probable");});
test("28 progression score is null when insufficient",()=>assert.equal(engine.calculateProgressionScore({code:"insufficientData",points:[]}).value,null));
test("29 progression score is numeric for improvement",()=>{const a=analysis(data());assert.equal(typeof a.progressionScore.value,"number");});
test("30 evidence identifies source sessions",()=>assert.deepEqual(analysis(data()).evidence.map(x=>x.sessionId),["s1","s2","s3"]));
test("31 explicit window limits evidence",()=>assert.equal(analysis(data([50,52,54,56,58]),{window:3}).evidence.length,3));
test("32 incomplete sessions are reported conservatively",()=>{const input=data([60,62]);input.sessions[1].status="incomplete";assert.ok(engine.normalizeProgrammingData(input).sessions[1].interrupted);});
test("33 impossible RIR is an anomaly",()=>{const input=data();input.sessions[0].exercises[0].completedSets[0].rir=12;assert.ok(engine.normalizeProgrammingData(input).anomalies.some(x=>x.anomalyType==="invalidRir"));});
test("34 negative load is an anomaly",()=>{const input=data();input.sessions[0].exercises[0].completedSets[0].load=-5;assert.ok(engine.normalizeProgrammingData(input).anomalies.length>0);});
test("35 fatigue requires multiple sessions",()=>assert.equal(engine.detectFatiguePattern({sessions:[session(1)]}).code,"insufficientData"));
test("36 local pain pattern is detected",()=>{const input=data([60,60,60]);input.sessions.forEach(x=>x.pain="ginocchio");const result=engine.detectFatiguePattern(engine.normalizeProgrammingData(input));assert.notEqual(result.code,"insufficientData");});
test("37 deload never auto-applies",()=>assert.ok(engine.suggestDeload(data()).warnings.includes("Non applicato automaticamente.")));
test("38 sparse deload request remains insufficient",()=>assert.equal(engine.suggestDeload(data([60])).code,"insufficientData"));
test("39 weekly analysis counts workouts",()=>assert.equal(engine.analyzeWeeklyProgress(data(),1).workoutCount,1));
test("40 workout analysis selects workout",()=>assert.equal(engine.analyzeWorkoutProgress(data(),"w1").scope,"workout"));
test("41 program analysis selects program",()=>assert.equal(engine.analyzeProgramProgress(data(),"p1").programId,"p1"));
test("42 unknown custom progression is unsupported",()=>{const a=analysis(data([60,62.5,65],{progressionId:"custom"}));assert.equal(engine.suggestExerciseProgression(a,"ex1",{progressionId:"custom"}).type,"unsupportedProgression");});
test("43 insufficient suggestion never invents a load",()=>assert.equal(engine.suggestExerciseProgression({programs:[program()],sessions:[]},"ex1").proposedPrescription.load,null));
test("44 simulation reports load delta",()=>assert.equal(engine.simulateProgrammingChange({sets:3,repRange:{min:8,max:10},load:60},{sets:3,repRange:{min:8,max:10},load:62.5}).loadDifference,2.5));
test("45 simulation warns on large multi-variable changes",()=>assert.ok(engine.simulateProgrammingChange({sets:2,reps:"8",load:50},{sets:4,reps:"12",load:70}).warnings.length));
test("46 invalid suggestion is rejected",()=>assert.equal(engine.validateProgrammingSuggestion({}).valid,false));
test("47 explanation exposes evidence count",()=>assert.equal(engine.explainProgrammingSuggestion({rationale:"x",evidence:[1,2]}).evidenceCount,2));
test("48 suggestion is deterministic",()=>{const a=analysis(data());assert.equal(engine.suggestExerciseProgression(a,"ex1").id,engine.suggestExerciseProgression(a,"ex1").id);});
test("49 all declared suggestion scopes are distinct",()=>assert.equal(new Set(engine.SUGGESTION_SCOPES).size,5));
test("50 custom is explicitly unsupported",()=>assert.ok(engine.UNSUPPORTED_PROGRESSION_IDS.includes("custom")));

progressionIds.forEach((progressionId,index)=>test(`${String(51+index).padStart(2,"0")} progression ${progressionId} returns a typed, validated result`,()=>{
  const input=data([60,62.5,65],{progressionId});
  if(progressionId==="top-set-backoff") input.sessions.forEach(row=>row.exercises[0].completedSets=[set(65,10,2,{technique:"top-set"}),set(55,10,3,{technique:"back-off"})]);
  const result=engine.suggestExerciseProgression(analysis(input),"ex1",{progressionId});
  assert.ok(engine.SUGGESTION_TYPES.includes(result.type));
  assert.equal(result.progressionType,progressionId);
  assert.equal(engine.validateProgrammingSuggestion(result).valid,true);
}));

test("66 runtime cache records hits",()=>{const runtime=engine.createProgrammingEngine({dataProvider:()=>data()});runtime.getExerciseAnalysis("ex1");runtime.getExerciseAnalysis("ex1");assert.ok(runtime.getCacheStats().hits>=1);});
test("67 runtime invalidation removes entries",()=>{const runtime=engine.createProgrammingEngine({dataProvider:()=>data()});runtime.getExerciseAnalysis("ex1");assert.ok(runtime.invalidateProgrammingAnalysis({scope:"exercise"})>=1);});
test("68 refresh returns analyses and suggestions",()=>{const result=engine.createProgrammingEngine({dataProvider:()=>data()}).refreshProgrammingAnalysis({week:1});assert.equal(result.exercises.length,1);assert.equal(result.suggestions.length,1);});
test("69 viewed decision does not modify program",()=>{let persisted;const runtime=engine.createProgrammingEngine({dataProvider:()=>data(),onPersist:value=>persisted=value});const id=runtime.getProgrammingSuggestions()[0].id;assert.equal(runtime.markSuggestionViewed(id),true);assert.equal(persisted.decisions[id].decision,"viewed");});
test("70 accepted decision explicitly reports no program mutation",()=>{const runtime=engine.createProgrammingEngine({dataProvider:()=>data()});const id=runtime.getProgrammingSuggestions()[0].id;assert.equal(runtime.recordSuggestionDecision(id,"accepted").programModified,false);});
test("71 invalid decision is refused",()=>{const runtime=engine.createProgrammingEngine({dataProvider:()=>data()});assert.equal(runtime.recordSuggestionDecision("x","auto-apply").ok,false);});
test("72 runtime API returns evidence",()=>{const runtime=engine.createProgrammingEngine({dataProvider:()=>data()});const suggestion=runtime.getProgrammingSuggestions()[0];assert.ok(runtime.getSuggestionEvidence(suggestion.id).length);});
test("73 runtime API returns simulation",()=>{const runtime=engine.createProgrammingEngine({dataProvider:()=>data()});const suggestion=runtime.getProgrammingSuggestions()[0];assert.equal(runtime.getSuggestionSimulation(suggestion.id).scope,"exercise");});
test("74 normalized output is JSON serializable",()=>assert.doesNotThrow(()=>JSON.stringify(engine.normalizeProgrammingData(data()))));
test("75 legacy schema-shaped state is accepted",()=>{const input=data();const normalized=engine.normalizeProgrammingData({state:{programs:input.programs,training:{sessions:input.sessions}}});assert.equal(normalized.sessions.length,3);});
