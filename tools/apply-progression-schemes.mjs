import fs from 'fs';

const P = 'src/app-main.js';
let src = fs.readFileSync(P, 'utf8');
const m = src.match(/const PROGRAM_LIBRARY = (\[[\s\S]*?\]);/);
if (!m) { console.error('PROGRAM_LIBRARY not found'); process.exit(1); }
const lib = JSON.parse(m[1]);

const num = (s) => { const n = String(s ?? '').match(/\d+(?:[.,]\d+)?/); return n ? Number(n[0].replace(',', '.')) : null; };
const range = (s) => { const a = String(s ?? '').match(/\d+/g); if (!a) return null; const x = +a[0], y = a[1] ? +a[1] : x; return [Math.min(x, y), Math.max(x, y)]; };
const rep = (b, lo, hi) => { if (b.min == null) return b.raw; if (hi != null && hi !== lo) return `${lo}-${hi}`; return `${lo}`; };
const TEST = (b) => `Test ${b.min || 8} RM`;

const SCHEMES = {
  // ---------- B program 1 ----------
  'B program 1|A': { id: 'linear-load', name: 'Carico lineare', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test di forza: 1 serie a esaurimento tecnico (riferimento nuovo ciclo).' };
    const sets = w === 4 ? Math.max(1, b.sets - 1) : b.sets;
    const rir = ['3','3','2','4','2','2','1',''][w - 1];
    return { sets, reps: rep(b, b.min, b.max), rir, rest: b.rest, note: 'CARICO LINEARE: reps fisse, +2,5-5% di carico a settimana se chiudi tutte le serie al RIR indicato. w4 scarico (-1 serie, RIR 4).' };
  } },
  'B program 1|B': { id: 'double-progression', name: 'Doppia progressione', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test 8-10RM per ripartire dal nuovo carico.' };
    const lo = b.min ?? 8, hi = b.max ?? 10;
    const r = w === 1 ? lo : w === 2 ? lo + 1 : w === 3 ? hi : w === 4 ? lo : hi;
    const sets = w === 4 ? Math.max(1, b.sets - 1) : b.sets;
    return { sets, reps: String(r), rir: ['3','3','2','4','2','2','1',''][w - 1], rest: b.rest, note: 'DOPPIA PROGRESSIONE: +1 ripetizione a settimana dentro il range; raggiunto il tetto, +2,5-5% di carico e riparti dal fondo scala.' };
  } },
  'B program 1|C': { id: 'volume-progression', name: 'Progressione di volume', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test di mantenimento.' };
    const ladder = [0,1,1,-1,1,2,2];
    return { sets: Math.max(1, b.sets + ladder[w - 1]), reps: rep(b, b.min, b.max), rir: ['3','3','2','4','2','2','1',''][w - 1], rest: b.rest, note: 'PROGRESSIONE DI VOLUME: carico stabile, cresce il numero di serie (fino a +2); w4/week8 tagliano il volume per il recupero.' };
  } },
  'B program 1|D': { id: 'rir-progression', name: 'Autoregolazione RIR', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Verifica RIR 1 su singola serie.' };
    return { sets: w === 4 ? Math.max(1, b.sets - 1) : b.sets, reps: rep(b, b.min, b.max), rir: ['3','3','2-3','4','2','2','1',''][w - 1], rest: b.rest, note: 'AUTOREGOLAZIONE RIR: aggiungi carico solo se l’ultima serie chiude al RIR target; altrimenti ripeti lo stesso carico.' };
  } },
  // ---------- B program 2 ----------
  'B program 2|A': { id: 'undulating-dup', name: 'Ondulazione giornaliera (DUP)', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'TEST DI RIFERIMENTO: 1 serie a esclusione tecnica (RIR 0-1) per fissare il nuovo carico di partenza del prossimo ciclo.' };
    const heavy = w % 2 === 1, lo = b.min ?? 6, hi = b.max ?? 10;
    const sets = w === 4 ? Math.max(1, b.sets - 1) : (heavy ? b.sets + 1 : Math.max(1, b.sets - 1));
    return { sets, reps: heavy ? String(lo) : String(hi + 3), rir: heavy ? '2' : '3', rest: b.rest, note: 'ONDULAZIONE GIORNALIERA (DUP): alterna sedute pesanti (più serie, rep basse, RIR 2) e leggere (meno serie, rep alte, RIR 3).' };
  } },
  'B program 2|B': { id: 'step-loading', name: 'Scalini di carico', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test dello scalino.' };
    return { sets: w === 4 ? Math.max(1, b.sets - 1) : b.sets, reps: rep(b, b.min, b.max), rir: ['3','3','2','2','2','1','1',''][w - 1], rest: b.rest, note: 'SCALINI DI CARICO: stesso carico per 2-3 settimane con RIR che scende, poi uno scalino (+5%) e si riparte dal RIR più alto.' };
  } },
  'B program 2|C': { id: 'reverse-pyramid', name: 'Piramide inversa', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'TEST DI RIFERIMENTO: 1 serie a esclusione tecnica (RIR 0-1) per fissare il nuovo carico di partenza del prossimo ciclo.' };
    const lo = b.min ?? 6, hi = b.max ?? 10;
    return { sets: w === 4 ? Math.max(1, b.sets - 1) : b.sets, reps: `${lo}-${hi}`, rir: ['2','2','1','3','1','1','0',''][w - 1], rest: b.rest, note: 'PIRAMIDE INVERSA: prima serie la più pesante, poi alleggerisci aumentando le reps nei set successivi (back-off interno).' };
  } },
  'B program 2|D': { id: 'top-set-backoff', name: 'Top set + backoff', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test del top set.' };
    const lo = b.min ?? 6, hi = b.max ?? 10;
    return { sets: `1+${w === 4 ? Math.max(1, b.sets - 1) : b.sets}`, reps: `${lo} (top) + ${hi + 2} (backoff)`, rir: w === 4 ? '3' : '2', rest: b.rest, note: 'TOP SET + BACKOFF: 1 serie top pesante a RIR 1-2, poi serie di backoff ~15-20% più leggere per accumulare volume di qualità.' };
  } },
  // ---------- Intensificazione ----------
  'Intensificazione|A': { id: 'intensity-progression', name: 'Progressione di intensità', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test di intensità.' };
    const lo = b.min ?? 6, hi = b.max ?? 10, mid = Math.round((lo + hi) / 2);
    const r = w >= 5 ? lo : w >= 3 ? mid : hi;
    return { sets: w === 4 ? Math.max(1, b.sets - 1) : b.sets, reps: String(r), rir: ['2','2','1','3','1','0-1','0',''][w - 1], rest: b.rest, note: 'PROGRESSIONE DI INTENSITÀ: le reps scendono a ogni mesociclo, il carico sale e il RIR si avvicina progressivamente al cedimento.' };
  } },
  'Intensificazione|B': { id: 'peak-taper', name: 'Peaking e taper', apply: (w, b) => {
    if (w === 8) return { sets: 2, reps: TEST(b), rir: '0-1', rest: b.rest, note: 'Test di picco (2 serie).' };
    const lo = b.min ?? 6, hi = b.max ?? 10;
    const sets = Math.max(1, b.sets + (w >= 5 ? 1 : 0) - (w === 4 || w === 7 ? 1 : 0));
    return { sets, reps: String(w >= 5 ? lo : hi), rir: ['2','2','2','3','2','1','2',''][w - 1], rest: b.rest, note: 'PEAKING: volume in salita fino a w6 e intensità in crescita; w7 pre-test riduce il volume a carico invariato (taper).' };
  } },
  'Intensificazione|C': { id: 'unilateral-wave', name: 'Ondulazione unilaterale', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test mono-lato.' };
    const lo = b.min ?? 8, hi = b.max ?? 10;
    return { sets: [3,3,4,2,4,4,2][w - 1], reps: w % 2 === 0 ? String(hi + 2) : `${lo}-${hi}`, rir: w % 2 === 0 ? '3' : '2', rest: b.rest, note: 'ONDULAZIONE UNILATERALE: alterna settimane di carico (rep basse) e settimane di controllo/volume; pareggia sempre sul lato debole.' };
  } },
  'Intensificazione|D': { id: 'deload-cycle', name: 'Ciclo di scarico 3:1', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test post-scarico.' };
    const del = w % 3 === 0;
    return { sets: del ? Math.max(1, b.sets - 1) : b.sets, reps: rep(b, b.min, b.max), rir: del ? '4' : ['3','2','-','2','2','-','1',''][w - 1], rest: b.rest, note: 'CICLO 3:1: due settimane di carico + una di scarico (volume -40%, RIR 4, carico invariato) ogni tre settimane.' };
  } },
  'Intensificazione|E': { id: 'heavy-cluster', name: 'Cluster pesante', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test cluster.' };
    const lo = b.min ?? 5;
    return { sets: b.sets, reps: `${lo} (${Math.max(1, lo - 3)}+2+1)`, rir: '0-1', rest: b.rest, note: 'CLUSTER PESANTE: spezza la serie in mini-cluster da 2-3 reps con 15" di pausa; carico da 3-5RM con volume totale più alto.' };
  } },
  'Intensificazione|F': { id: 'density-progression', name: 'Progressione di densità', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test di densità.' };
    return { sets: b.sets, reps: rep(b, b.min, b.max), rir: '2-3', rest: [`2'`,`1'45"`,`1'30"`,`2'`,`1'30"`,`1'15"`,`1'`,`1'`][w - 1], note: 'PROGRESSIONE DI DENSITÀ: carico e volume restano fissi, si accorcia il recupero a ogni settimana per alzare la densità di lavoro.' };
  } },
  // ---------- Intensità Agosto-Ottobre ----------
  'Intensità Agosto-Ottobre|A': { id: 'micro-loading', name: 'Micro-carichi', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test micro-carichi.' };
    const lo = b.min ?? 8, hi = b.max ?? 12;
    return { sets: b.sets, reps: `${hi}-${lo}-x`, rir: ['3','3','2','4','2','2','1',''][w - 1], rest: b.rest, note: 'MICRO-CARICHI: incrementi da 0,5-1 kg con doppia a scalare (leggero→pesante→riposa), senza mai scendere sotto la rep minima.' };
  } },
  'Intensità Agosto-Ottobre|B': { id: 'rpe-progression', name: 'RPE autoregolato', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test a RPE target.' };
    return { sets: b.sets, reps: rep(b, b.min, b.max), rir: ['3','3','2','4','2','1','1',''][w - 1], rest: b.rest, note: 'RPE AUTOREGOLATO: +0,5-1 kg a settimana solo se l’RPE resta nel target (w1-3 @7, w5 @8, w6-7 @9).' };
  } },
  'Intensità Agosto-Ottobre|C': { id: 'rest-pause', name: 'Rest-pause', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test rest-pause.' };
    const hi = b.max ?? 12;
    return { sets: b.sets, reps: `${hi}+${Math.max(3, Math.round(hi / 3))}+2`, rir: '0-1', rest: b.rest, note: 'REST-PAUSE: dopo il set a cedimento tecnico, 15-20" di pausa e prosegui con mini-set fino a esaurimento.' };
  } },
  'Intensità Agosto-Ottobre|D': { id: 'ascending-pyramid', name: 'Piramide ascendente', apply: (w, b) => {
    if (w === 8) return { sets: 1, reps: TEST(b), rir: '', rest: b.rest, note: 'Test piramide.' };
    const lo = b.min ?? 8, hi = b.max ?? 12, mid = Math.round((lo + hi) / 2);
    return { sets: b.sets, reps: `${hi}-${mid}-${lo}`, rir: ['3','3','2','4','2','2','1',''][w - 1], rest: b.rest, note: 'PIRAMIDE ASCENDENTE: parti leggero e sali di carico set dopo set riducendo le reps; il carico top è il riferimento della settimana.' };
  } }
};

const groups = new Map();
for (const p of lib) { const k = `${p.phase}|${p.letter}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }

const seen = new Set();
let covered = 0;
for (const [k, arr] of groups) {
  arr.sort((a, b) => a.week - b.week);
  const scheme = SCHEMES[k];
  if (!scheme) { console.error('NO SCHEME FOR', k); process.exit(1); }
  seen.add(scheme.id);
  covered++;
  const base = {};
  arr[0].exercises.forEach((ex, i) => { const r = range(ex.reps); base[i] = { sets: num(ex.sets) || 3, min: r ? r[0] : null, max: r ? r[1] : null, raw: String(ex.reps || ''), rest: String(ex.rest || '') }; });
  for (const sheet of arr) {
    const w = Number(sheet.week);
    sheet.schemeId = scheme.id;
    sheet.schemeName = scheme.name;
    sheet.note = `${sheet.note || ''} · Metodo: ${scheme.name}`;
    sheet.exercises.forEach((ex, i) => {
      const b = base[i]; if (!b) return;
      const o = scheme.apply(w, b); if (!o) return;
      if (o.sets != null) ex.sets = String(o.sets);
      if (o.reps != null) ex.reps = String(o.reps);
      ex.rir = o.rir != null ? String(o.rir) : '';
      if (o.rest != null) ex.rest = String(o.rest);
      if (o.note) ex.note = o.note;
    });
  }
}

if (covered !== 18) { console.error('Expected 18 scheda groups, found', covered); process.exit(1); }
if (seen.size !== 18) { console.error('Duplicate scheme ids!', [...seen]); process.exit(1); }

const json = JSON.stringify(lib);
src = src.replace(m[0], `const PROGRAM_LIBRARY = ${json};`);
fs.writeFileSync(P, src);

// JSON export for reference
fs.writeFileSync('PROGRESSIONI-SCHEDE.json', JSON.stringify({
  version: 'v147.55-progressione-intensita',
  generatedAt: new Date().toISOString(),
  groups: [...groups.entries()].map(([k, arr]) => ({ key: k, phase: arr[0].phase, letter: arr[0].letter, focus: arr[0].focus, weeks: arr.length, schemeId: arr[0].schemeId, schemeName: arr[0].schemeName }))
}, null, 2));

// test
const test = `import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/app-main.js', import.meta.url), 'utf8');
const m = src.match(/const PROGRAM_LIBRARY = (\\[[\\s\\S]*?\\]);/);
assert.ok(m, 'PROGRAM_LIBRARY presente');
const lib = JSON.parse(m[1]);

test('tutte le schede esistenti sono coperte da un metodo di progressione', () => {
  const groups = new Map();
  for (const p of lib) { const k = p.phase + '|' + p.letter; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
  assert.equal(groups.size, 18, 'attese 18 schede (4 programmi x lettere)');
  for (const [k, arr] of groups) {
    assert.ok(arr.length === 8, k + ' deve avere 8 settimane');
    for (const sheet of arr) assert.ok(sheet.schemeId, k + ' settimana ' + sheet.week + ' senza metodo');
  }
});

test('nessuna scheda condivide la stessa logica di progressione', () => {
  const groups = new Map();
  for (const p of lib) { const k = p.phase + '|' + p.letter; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
  const ids = [...groups.values()].map((arr) => arr[0].schemeId);
  assert.equal(new Set(ids).size, ids.length, 'metodi duplicati: ' + ids.join(', '));
  assert.equal(ids.length, 18);
});

test('ogni settimana contiene la regola di progressione in nota', () => {
  for (const p of lib) {
    for (const ex of p.exercises) {
      assert.ok(String(ex.note || '').length > 10, 'nota progressione mancante in ' + p.code);
    }
  }
});
`;
fs.writeFileSync('tests/v14755-progression-schemes.test.mjs', test);

console.log('OK groups=' + covered + ' distinctSchemes=' + seen.size);
console.log([...groups.keys()].map((k) => k + '=' + SCHEMES[k].id).join('\n'));
