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
