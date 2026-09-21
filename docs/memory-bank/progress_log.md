# Progress Log — Coaching-App

Questo file tiene il “filtro cronologico” del progetto. Ogni checkpoint aggiunto dal trigger automatico viene loggato qui in forma compatta, con link al checkpoint completo.

Checkpoint index:
- vedi checkpoint.md per la cronologia dettagliata

Regola di aggiornamento:
- Dopo ogni N task completato / commit effettuato, viene aggiunto un nuovo checkpoint.
- Il checkpoint deve registrare:
  - data/ora
  - commit di riferimento (se disponibile)
  - cosa è cambiato
  - eventuale stato dei test (measurement rig / records / logging)
  - eventuale blocco aperto
  - prossimi step consigliati

Obiettivo:
- Non perdere il filo del contesto anche se si cambia chat e si riprende dopo tempo.

## Cronologia checkpoint

### 1) 2026-09-11

- UUID: 0001
- Commit riferimento: b8a7ce1
- Cosa è cambiato: setup memory bank con aggiornamento automatico dei checkpoint.
- Stato/evidenza attuale:
  - memory bank creata in docs/memory-bank/
  - activeContext.md, progress_log.md, systemPatterns.md, development_recipes.md, checkpoint.md
- Stato test: da aggiornare al prossimo trigger
- Blocco aperto: nessuno
- Prossimo step consigliato: definire il trigger automatico ogni tot task/commit

### 2) 2026-09-21

- UUID: 0002
- Commit riferimento: questo commit — oggetto "fix: keep-awake 404 + sync cloud riparata + suite test tutta verde (163/163)" (dopo l'amend l'hash cambia: cercare per oggetto)
- Cosa è cambiato:
  - Ripristinato `keep-awake-v14742.js` (sparito col merge Genspark → 404 a ogni avvio); aggiunto ad `APP_SHELL` nel service worker + nuovo test `tests/v14742-keep-awake-assets.test.mjs`.
  - Fix sync cloud (src/app-main.js): nella finestra di quiete 8s del listener onSnapshot, uno snapshot con stamp PIÙ NUOVO della nostra scrittura non è un eco ma una modifica remota vera → viene applicato subito; `lastCloudSnapshotAt` ora viene registrato solo quando lo snapshot è davvero processato (prima quelli scartati erano persi per sempre).
  - Fix `saveCloudPrograms`: i programmi MAI registrati in `cloudProgramRevisions` vengono ora sempre inviati (prima restavano fuori dal cloud).
  - Fix `upsertTechnicalExercise`: la proiezione torna via `technicalExerciseProfile(...)` così gli override del coach sono applicati subito dopo il salvataggio.
  - Master Library: `normalizeRecord` conserva `technique`, `manualOverrides`, `aiAnalysis`.
  - Test riparati/allineati: `coach-ai-classification` (perimetro "day" mancante), `phase14` (portale modal, assert drift), `phase17` (nav mobile 5 tab, fake cloud con auto-creazione sottocollection).
- Stato test: **163/163 pass** (`node --test`), `node --check` OK su tutti i JS.
- Blocco aperto: nessuno
- Prossimo step consigliato: Fase 0.4/0.5 del piano (gitignore backup/ + versione unica in app-config), poi Fase 1.9/1.10/1.11.