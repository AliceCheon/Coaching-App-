import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

// Valida il file che alimenta il widget "Allenamento di oggi" sullo schermo
// esterno: se il JSON è rotto, il widget mostra "Config non valida".

const cfg = JSON.parse(
  readFileSync(new URL('../widget-config.json', import.meta.url), 'utf8')
);

const GIORNI = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

test('widget-config: fase e settimana presenti', () => {
  assert.strictEqual(typeof cfg.fase, 'string');
  assert.ok(cfg.fase.length > 0);
  assert.ok(Array.isArray(cfg.settimana));
  assert.ok(cfg.settimana.length > 0);
});

test('widget-config: ogni voce della settimana è valida', () => {
  for (const d of cfg.settimana) {
    assert.ok(GIORNI.includes(d.giorno), 'giorno valido: ' + d.giorno);
    assert.ok(typeof d.tipo === 'string' && d.tipo.length > 0, 'tipo presente');
    assert.ok(typeof d.dettaglio === 'string', 'dettaglio presente');
    assert.match(d.ora, /^([01]\d|2[0-3]):[0-5]\d$/, 'ora in formato HH:MM');
  }
});

test('widget-config: nessun giorno duplicato', () => {
  const giorni = cfg.settimana.map((d) => d.giorno);
  assert.strictEqual(new Set(giorni).size, giorni.length);
});
