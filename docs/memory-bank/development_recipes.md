# Development Recipes — Coaching-App

Questo file raccoglie le ricette operative consigliate per questo progetto. Deve essere útil quando si parte con una nuova sessione di lavoro e si vuole mantenere coerenza con il modo in cui il codebase è stato sviluppato fino a qui.

## Current recipes

### Aggiungere / modificare una progressione (metodo)
- I metodi vivono in `PROGRESSION_TEMPLATE_LIBRARY` (~1602 di `src/app-main.js`).
- Per un metodo con sequenza **settimana per settimana**, usa `parameters.pattern`:
  array `["<serie>:<reps>", ...]` (es. `["1:test 12rm, poi 1x8","2:10-x","3:10-8-x"]`).
  Il generatore lo applica come **ultima parola** (indipendente dall'esercizio).
- Le sequenze "Intensità ottobre-dicembre" vengono dal foglio Excel
  "Intensità ottobre-dicembre" (schede A/B/C/D). NON inventarle: leggerle verbatim.
- Editor: `progressionTemplateEditorHtml` (`data-progression-pattern`), salvataggio in
  `saveCoachUiModal`. Se aggiungi una colonna/azione, aggiorna **entrambi**.
- Dopo ogni modifica: `node --check src/app-main.js` + la suite progressioni
  (`tests/phase6-progressions.test.mjs`, `tests/intensita-ottobre-dicembre.test.mjs`,
  `tests/v14791-*`, `tests/v14792-*`).

### Bump versione + rilascio fase
- `node tools/bump-version.mjs v147.XX-suffisso` (aggiorna ~27 file: config, index,
  manifest, service worker, FIREBASE-LOGIN, test).
- Poi: `node --check src/app-main.js` → suite completa in background
  (`node --test tests/*.test.mjs`, ~8 min) → checkpoint memory-bank → commit → **push**
  → PR → merge su `main` (GitHub Pages deploya da `main`).

### Adding / updating tests
- Se tocco un modulo, verifico primi i test nell’area corrispondente:
  - Measurement rig / Tests
  - Records / Tests
  - Logging / Tests
- In caso di dubbio, prima controllo se esiste già un test per il behaviour, poi aggiungo o adatto.

### Touching the sync queue
- Utilizzo i path definiti dalla code: enqueue, mark*, patch, removeEntity e stats.
- Non introduco nuovi stati senza valutare l’impatto su logging/audit e su eventuali consumer downstream.

### WASM interaction
- Prima di toccare l'integrazione WASM, identifico:
  - l'entry file JS che carica / usa il modulo
  - gli export usati
  - eventuali test esistenti in quell'area

## Reporting conventions

- Quando posso, registro brevemente:
  - commit di riferimento
  - area modificata
  - stato dei test dopo la modifica (se disponibile)
  - eventuale decisione architetturale presa

## Changelog dello sviluppo

- vedi progress_log.md e checkpoint.md per lo storico operativo.