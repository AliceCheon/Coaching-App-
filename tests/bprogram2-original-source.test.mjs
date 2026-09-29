import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/app-main.js', import.meta.url), 'utf8');
const match = src.match(/const PROGRAM_LIBRARY = (\[[\s\S]*?\]);/);
assert.ok(match, 'PROGRAM_LIBRARY presente');
const library = JSON.parse(match[1]);
const weeks = library.filter((sheet) => sheet.phase === 'B program 2' && sheet.letter === 'D').sort((a, b) => a.week - b.week);

const sourceRows = [
  [95, 'Pressa45°_piedi_alti_schienale_chiuso', [[2,'5'],[2,'5'],[2,'5'],[1,'4'],[2,'6'],[2,'6'],[1,'6'],[1,'Test 8 RM']]],
  [96, 'Pressa45°_piedi_alti_schienale_chiuso', [[1,'10'],[2,'10'],[3,'10'],[1,'8'],[3,'10'],[2,'10'],[1,'10'],null]],
  [99, 'Bulgaro_focus_glutei', [[4,'5'],[4,'5'],[3,'6'],[2,'6'],[3,'8'],[3,'8'],[2,'8'],[1,'Test 10 RM']]],
  [102, 'Hip_Thrust', [[4,"50'' tenuta"],[4,"50'' tenuta"],[4,"55'' tenuta"],[3,"40'' tenuta"],[4,"60'' tenuta"],[4,"50'' tenuta"],[2,"55'' tenuta"],[1,'max tempo']]],
  [104, 'Slanci_cavo_basso', [[2,'8'],[2,'8'],[2,'8'],[1,'6'],[2,'10'],[2,'10'],[1,'10'],[10,'Test 8 RM']]],
  [105, 'Slanci_cavo_basso', [[1,'15'],[2,'15'],[3,'15'],[1,'10'],[3,'15'],[2,'15'],[1,'15'],null]],
  [108, 'Leg_Extension', [[3,'12- 15'],[3,'12- 15'],[3,'12- 15'],[2,'12- 15'],[3,'12- 15'],[3,'12- 15'],[3,'12- 15'],[2,'12-15']]],
  [110, 'Slancio_laterale_cavo_basso_triset', [[4,'10-8.'],[4,'10-8.'],[4,'10-8.'],[2,'10-8.'],[4,'10-8.'],[4,'10-8.'],[4,'10-8.'],[1,'Test 10 RM']]],
  [112, 'Calf_al_multypower', Array.from({ length: 8 }, () => [4,'10-8'])]
];

test('B program 2 Scheda D rispecchia esercizi, serie, reps e scarico del foglio sorgente', () => {
  assert.equal(weeks.length, 8);
  for (const sheet of weeks) {
    const expectedRows = sourceRows.filter(([, , values]) => values[sheet.week - 1] !== null);
    assert.equal(sheet.exercises.length, expectedRows.length, `${sheet.code}: numero esercizi`);
    for (const [row, name, values] of expectedRows) {
      const occurrence = sourceRows.slice(0, sourceRows.findIndex((item) => item[0] === row)).filter((item) => item[1] === name).length;
      const exercise = sheet.exercises.filter((item) => item.name === name)[occurrence];
      assert.ok(exercise, `${sheet.code}: riga Excel ${row} assente`);
      const [sets, reps] = values[sheet.week - 1];
      assert.deepEqual([exercise.sets, exercise.reps], [String(sets), reps], `${sheet.code}: riga Excel ${row}`);
      assert.equal(exercise.rir, '', `${sheet.code}: la riga ${row} non prescriveva RIR`);
      assert.equal(exercise.metadata.excelSourceRow, row);
    }
    assert.equal(sheet.schemeId, 'excel-source');
  }
});

test('l’Hip Thrust conserva la progressione a tempo e il test max tempo originale', () => {
  const first = weeks[0].exercises.find((exercise) => exercise.name === 'Hip_Thrust');
  assert.equal(first.reps, "50'' tenuta");
  assert.match(first.metadata.excelNote1, /aggiungendo/i);
  assert.match(first.metadata.excelNote2, /ogni\s+2 settimane/i);
  assert.match(first.tempo, /per ogni 10 secondi/i);
  const last = weeks[7].exercises.find((exercise) => exercise.name === 'Hip_Thrust');
  assert.equal(last.reps, 'max tempo');
});
