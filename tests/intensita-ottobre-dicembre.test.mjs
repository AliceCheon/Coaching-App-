import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/app-main.js', import.meta.url), 'utf8');
const m = src.match(/const PROGRAM_LIBRARY = (\[[\s\S]*?\]);/);
assert.ok(m, 'PROGRAM_LIBRARY presente');
const lib = JSON.parse(m[1]);

const PHASE = 'Intensità ottobre-dicembre';
const iod = lib.filter((p) => p.phase === PHASE);
const byCode = new Map(iod.map((p) => [p.code, p]));
const ex = (code, name) => {
  const card = byCode.get(code);
  assert.ok(card, 'card ' + code + ' presente');
  const found = card.exercises.find((e) => e.name === name);
  assert.ok(found, name + ' presente in ' + code);
  return found;
};

test('la fase importata ha 4 schede x 8 settimane con metodo "Intensità:"', () => {
  assert.equal(iod.length, 32, 'attese 32 schede settimanali');
  const letters = new Set(iod.map((p) => p.letter));
  assert.deepEqual(letters, new Set(['A', 'B', 'C', 'D']));
  for (const p of iod) {
    assert.match(p.schemeName, /^Intensità:/, p.code + ' senza nome "Intensità:"');
    assert.ok(['intensity-test12-wave', 'intensity-test10-climb', 'intensity-midcycle-test'].includes(p.schemeId), p.code + ' schemeId inatteso');
    for (const e of p.exercises) {
      assert.ok(Array.isArray(e.progression?.weeks) && e.progression.weeks.length > 0, p.code + ' ' + e.name + ' senza settimane excel');
      for (const w of e.progression.weeks) assert.equal(w.source, 'excel', p.code + ' ' + e.name + ' settimana non excel');
    }
  }
});

test('Lat machine: test 12rm poi ondata 10-8-x / 10-x / 10 (verbatim Excel)', () => {
  const w1 = ex('IOD-A1', 'Lat_machine_Triangolo');
  assert.equal(w1.sets, '1');
  assert.equal(w1.reps, 'test 12rm, poi 1x8');
  assert.equal(w1.rir, '');
  assert.equal(ex('IOD-A2', 'Lat_machine_Triangolo').reps, '10-8-x');
  assert.equal(ex('IOD-A3', 'Lat_machine_Triangolo').reps, '10-x');
  assert.equal(ex('IOD-A4', 'Lat_machine_Triangolo').reps, '10');
  assert.equal(ex('IOD-A6', 'Lat_machine_Triangolo').reps, '10-x-x');
  assert.equal(ex('IOD-A8', 'Lat_machine_Triangolo').sets, '2');
  assert.equal(ex('IOD-A8', 'Lat_machine_Triangolo').reps, '10');
  const weeks = w1.progression.weeks;
  assert.equal(weeks.length, 8);
  assert.deepEqual(weeks.map((w) => w.week), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(weeks[1].reps, '10-8-x');
});

test('Stacco RDL: test 10rm e salita 6→7→8→9 (verbatim Excel)', () => {
  const w1 = ex('IOD-A1', 'Stacco_RDL');
  assert.equal(w1.reps, 'test 10 rm, poi 1x6');
  assert.equal(w1.rir, '');
  assert.equal(ex('IOD-A2', 'Stacco_RDL').reps, '6');
  assert.equal(ex('IOD-A5', 'Stacco_RDL').reps, '7');
  assert.equal(ex('IOD-A7', 'Stacco_RDL').reps, '8');
  assert.equal(ex('IOD-A8', 'Stacco_RDL').sets, '2');
  assert.equal(ex('IOD-A8', 'Stacco_RDL').reps, '9');
});

test('Leg curls: 3×12-8 con scarico a 2 serie nelle settimane 4 e 8', () => {
  const setsByWeek = [];
  for (let w = 1; w <= 8; w += 1) {
    const card = byCode.get('IOD-A' + w);
    setsByWeek.push(card.exercises.find((e) => e.name === 'Leg_curls').sets);
  }
  assert.deepEqual(setsByWeek, ['3', '3', '3', '2', '3', '3', '3', '2']);
  assert.equal(ex('IOD-A1', 'Leg_curls').reps, '12-8');
});

test('Pendulum e Panca piana portano i propri test (schede B)', () => {
  assert.equal(ex('IOD-B1', 'Pendulum').reps, 'test 10rm, poi 1x6');
  assert.equal(ex('IOD-B8', 'Pendulum').sets, '2');
  assert.equal(ex('IOD-B8', 'Pendulum').reps, '8');
  assert.equal(ex('IOD-B4', 'Panca_piana').sets, '1');
  assert.equal(ex('IOD-B4', 'Panca_piana').reps, 'test 10 rm');
  assert.equal(ex('IOD-B5', 'Panca_piana').reps, '7');
  assert.equal(ex('IOD-B8', 'Panca_piana').sets, '2');
  assert.equal(ex('IOD-B8', 'Panca_piana').reps, '9');
});

test('Front squat machine (scheda D) parte dal test 12rm', () => {
  const w1 = ex('IOD-D1', 'Front_squat_machine');
  assert.equal(w1.sets, '1');
  assert.equal(w1.reps, 'test 12rm, poi 1x8');
  assert.equal(w1.rir, '');
  assert.equal(ex('IOD-D2', 'Front_squat_machine').reps, '10-x');
});

test('nessun default generico della libreria tecnica nelle prescrizioni', () => {
  for (const p of iod) {
    for (const e of p.exercises) {
      assert.ok(!['6-12', '10-20'].includes(String(e.reps)), p.code + ' ' + e.name + ' reps generiche: ' + e.reps);
    }
  }
});

test('le fasi storiche non sono toccate (144 schede + 32 nuove)', () => {
  assert.equal(lib.length, 176);
  const legacy = lib.find((p) => p.code === 'B1-A1');
  assert.equal(legacy.exercises[0].name, 'Hip_Thrust');
  assert.equal(legacy.exercises[0].reps, '15');
});

test('PROGRESSIONI-SCHEDE.json mappa la nuova fase sui metodi "Intensità:"', () => {
  const data = JSON.parse(readFileSync(new URL('../PROGRESSIONI-SCHEDE.json', import.meta.url), 'utf8'));
  const groups = data.groups.filter((g) => g.phase === PHASE);
  assert.equal(groups.length, 4);
  const expected = {
    A: 'intensity-test12-wave',
    B: 'intensity-test10-climb',
    C: 'intensity-test12-wave',
    D: 'intensity-midcycle-test'
  };
  for (const g of groups) assert.equal(g.schemeId, expected[g.letter], 'gruppo ' + g.letter);
});

// v147.56 — RIR/RPE/KG sempre vuoti (si compilano in allenamento); "poi 1x8"/"poi 1x6"
// accanto al test nella SOLA settimana 1; nota = descrizioni Excel; metodo linkato via templateId
const m56 = src.match(/const PROGRAM_LIBRARY = (\[[\s\S]*?\]);/);
const lib56 = JSON.parse(m56[1]);
const iod56 = lib56.filter((c) => typeof c.code === 'string' && c.code.startsWith('IOD-'));
for (const card of iod56) {
  const isWeek1 = String(card.week) === '1';
  for (const ex of card.exercises) {
    if (String(ex.rir || '').trim() !== '') throw new Error('RIR non vuoto in ' + card.code + '/' + ex.name);
    if (String(ex.rpe || '').trim() !== '' || String(ex.kg || '').trim() !== '') throw new Error('RPE/KG non vuoti in ' + card.code + '/' + ex.name);
    if (String(ex.note || '').startsWith('INTENSITÀ')) throw new Error('nota col prefisso del metodo in ' + card.code + '/' + ex.name);
    if (ex.progression?.templateId !== card.schemeId) throw new Error('metodo non linkato in ' + card.code + '/' + ex.name);
    for (const w of ex.progression?.weeks || []) if (String(w.rir || '').trim() !== '') throw new Error('RIR non vuoto nelle settimane di progressione di ' + card.code + '/' + ex.name);
    const reps = String(ex.reps || '').toLowerCase();
    if (isWeek1 && reps.includes('test 12') && !reps.includes('poi 1x8')) throw new Error('manca "poi 1x8" accanto a test 12rm in ' + card.code + '/' + ex.name);
    if (isWeek1 && reps.includes('test 10') && !reps.includes('poi 1x6')) throw new Error('manca "poi 1x6" accanto a test 10rm in ' + card.code + '/' + ex.name);
    if (!isWeek1 && reps.includes('poi 1x')) throw new Error('"poi 1x" fuori dalla settimana 1 in ' + card.code + '/' + ex.name);
  }
}
for (const tid of ['intensity-test12-wave', 'intensity-test10-climb', 'intensity-midcycle-test']) {
  if (!src.includes('"' + tid + '"')) throw new Error('template ' + tid + ' mancante nella libreria del selettore');
}
console.log('v14775: rir/rpe/kg puliti, poi-1xN solo in settimana 1, note/template OK');
