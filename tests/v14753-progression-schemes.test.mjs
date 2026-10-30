import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/app-main.js', import.meta.url), 'utf8');
const m = src.match(/const PROGRAM_LIBRARY = (\[[\s\S]*?\]);/);
assert.ok(m, 'PROGRAM_LIBRARY presente');
const lib = JSON.parse(m[1]);

test('tutte le schede esistenti sono coperte da un metodo di progressione', () => {
  const groups = new Map();
  for (const p of lib) { const k = p.phase + '|' + p.letter; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
  assert.equal(groups.size, 22, 'attese 22 schede (5 fasi x lettere)');
  for (const [k, arr] of groups) {
    assert.ok(arr.length === 8, k + ' deve avere 8 settimane');
    for (const sheet of arr) assert.ok(sheet.schemeId, k + ' settimana ' + sheet.week + ' senza metodo');
  }
});

test('ogni scheda mantiene lo stesso metodo su tutte le settimane', () => {
  const groups = new Map();
  for (const p of lib) { const k = p.phase + '|' + p.letter; if (!groups.has(k)) groups.set(k, new Set()); groups.get(k).add(p.schemeId); }
  for (const [k, ids] of groups) assert.equal(ids.size, 1, k + ' ha metodi misti: ' + [...ids].join(', '));
  const distinct = new Set([...groups.values()].map((ids) => [...ids][0]));
  assert.equal(distinct.size, 21, 'attesi 21 metodi distinti (18 storici + 3 "Intensità:" condivisi tra le schede di ottobre-dicembre)');
});

test('ogni settimana: metodo linkato via templateId, nota = descrizioni Excel', () => {
  for (const p of lib) {
    for (const ex of p.exercises) {
      if (String(p.code||'').startsWith('IOD-')) {
        assert.equal(ex.progression?.templateId, p.schemeId, 'metodo non linkato in ' + p.code);
        assert.ok(!String(ex.note||'').startsWith('INTENSITÀ'), 'nota col prefisso del metodo in ' + p.code);
      } else {
        assert.ok(String(ex.note || '').length > 10, 'nota progressione mancante in ' + p.code);
      }
    }
  }
});
