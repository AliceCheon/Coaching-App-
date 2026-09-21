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

### 3) 2026-09-21

- UUID: 0003
- Commit riferimento: questo commit — oggetto "chore: fase 0.4+0.5 — backup/ fuori dal repo e versione unificata v147.44" (dopo l'amend l'hash cambia: cercare per oggetto)
- Cosa è cambiato:
  - Fase 0.4: `backup/` in `.gitignore` + `git rm -r --cached` (6 file restano in locale, ~7 MB fuori dal repo); il test nutrizione ora legge il JSON canonico di root (hash identico alla copia backup, verificato).
  - Fase 0.5: fonte unica di versione — `app-config-v144.js` (build `v147.44-coach-ai-sync`, cache `atlas-app-v14744-coach-ai-sync`); i 36 `?v=` di index.html (prima su 9 valori diversi), manifest, FIREBASE-LOGIN.md, CACHE_NAME del SW e 16 test allineati al token `v14744`.
  - Nuovo test `tests/version-single-source.test.mjs`: fallisce se un solo `?v=` resta indietro rispetto ad app-config; valida anche la registrazione SW guidata da APP_BUILD.
- Stato test: **164/164 pass** (`node --test`), sintassi OK.
- Blocco aperto: nessuno
- Prossimo step consigliato: decisione App Check (Fase 0.6) + Fase 1.9/1.10/1.11 (versione motore CoachAI, log decisioni unico v11, un solo ingresso AI), poi Fase 2 (estrazione src/coach-ai/).

### 4) 2026-09-21 — Fase 1 completata

- UUID: 0004
- Commit riferimento: 888a111
- Cosa è cambiato:
  - Fase 1.9: `state.coachAi3.version` segue SEMPRE `window.BarbellDivaCoachAI3.VERSION` (costante `COACH_AI3_VERSION`, fallback "3.0.0" per i contesti test senza il motore). Gli stati salvati con "3.1.0" si riallineano al primo avvio senza migrazione dedicata.
  - Fase 1.10: `DATA_SCHEMA_VERSION = 11` + `migrateV10ToV11` — log decisioni unico `coachAi3.decisions` (unione history+ignoreHistory, dedupe per id, ordinati per data, cap 500) con fallback legacy per i lettori; `insightHistory` torna scritto dall'analisi (dedupe per id, cap 50, mai bloccante): la cronologia passata alla valutazione non è più sempre vuota.
  - Fase 1.11: decisione documentata in `docs/DOC-INTEGRITY-REPORT.md` — i "5 canali" AI sono in realtà una sola architettura con più porte: unica sorgente `coachAiSuggestions()`, unica superficie di analisi (`coachAi2PageHtml`), entry point coerenti (panel/aside/floating/popup/dashboard) e Diva Bot = identità, non canale dati. **Non si rimuove nulla** (coperto da phase8/9/10/21…); la duplicazione reale era nel motore, già eliminata in Fase 1.7/1.8.
- Stato test: 164/164 pass in locale (`node --test`); CI run #175 **success** su GitHub.
- Blocco aperto: nessuno
- Prossimo step consigliato: Fase 2 — creare `src/coach-ai/` (rules/state/bridge/ui, ~2.500 righe fuori da app-main.js, stesso pattern IIFE+globali), `coach-ai.css` dedicato con namespace unificato (`.ai2-*` → `.coach-ai-*`), aggiornare `APP_SHELL` del service worker.