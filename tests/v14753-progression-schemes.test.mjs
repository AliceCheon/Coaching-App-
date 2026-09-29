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
  // Le prescrizioni trascritte da un programma sorgente non devono essere
  // forzate dentro un algoritmo sintetico solo per avere ID tutti diversi.
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

test('le prescrizioni effettive cambiano tra le settimane di ogni scheda', () => {
  const groups = new Map();
  for (const p of lib) {
    const key = p.phase + '|' + p.letter;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  for (const [key, weeks] of groups) {
    weeks.sort((a, b) => Number(a.week) - Number(b.week));
    assert.equal(weeks.length, 8, key + ' deve avere 8 settimane');
    const tracks = new Map();
    for (const week of weeks) {
      for (const [index, exercise] of (week.exercises || []).entries()) {
        const track = `${index}:${String(exercise.name || exercise.exercise || '').trim().toLowerCase()}`;
        if (!tracks.has(track)) tracks.set(track, []);
        tracks.get(track).push(JSON.stringify([exercise.sets, exercise.reps, exercise.rir, exercise.rest]));
      }
    }
    const changingTracks = [...tracks.values()].filter((values) => new Set(values).size > 1);
    assert.ok(changingTracks.length > 0, key + ' non ha alcuna prescrizione settimanale variabile');
  }
});

test('le settimane importate dal file sorgente restano una trascrizione, non un template sintetico', () => {
  const sourceWeeks = lib.filter((sheet) => sheet.phase === 'B program 2' && sheet.letter === 'D');
  assert.equal(sourceWeeks.length, 8);
  assert.ok(sourceWeeks.every((sheet) => sheet.schemeId === 'excel-source'));
  const prescribedRir = sourceWeeks.flatMap((sheet) => sheet.exercises).filter((exercise) => exercise.rir);
  assert.equal(prescribedRir.length, 0, 'il foglio Excel originale non assegna target RIR a questa scheda');
});
