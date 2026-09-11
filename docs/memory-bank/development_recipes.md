# Development Recipes — Coaching-App

Questo file raccoglie le ricette operative consigliate per questo progetto. Deve essere útil quando si parte con una nuova sessione di lavoro e si vuole mantenere coerenza con il modo in cui il codebase è stato sviluppato fino a qui.

## Current recipes

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