# File modificati v144

## Applicazione

- `index.html` — rimozione riferimenti ai moduli esclusi, build/cache, backup automatici, diagnostica completa;
- `service-worker.js` — cache v144 e shell alleggerita;
- `manifest.webmanifest` — URL v144;
- `app-config-v144.js` — nuovo modulo di configurazione build/cache/limiti;
- `.github/workflows/tests.yml` — esecuzione della suite v144.

## Test e documentazione

- `tests/v144-core.test.mjs` — nuova suite coerente con la struttura corrente;
- `CHANGELOG-V144.md`;
- `TEST-REPORT-V144.md`;
- `MODIFICHE-V144.md`.

## File rimossi dal pacchetto

- `nutrizione/index.html`;
- `food-backup.js`;
- `photo-store.js`;
- `workout-pro.js`;
- `workout-pro.css`;
- `dashboard-alimentazione-backup-2026-07-15.json`.
