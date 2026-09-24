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

### 5) 2026-09-23 — Selettore "Fase": etichetta con il nome della scheda (build v147.50)

- UUID: 0005
- Commit riferimento: 56cdd03 (working tree)
- Cosa è cambiato:
  - Bug segnalato: in "Workout del giorno → Modalità Manuale" l'elenco Fase mostrava solo `program.phase`, quindi la scheda nuova ("Intensità 2 ottobre-dicembre", fase "peaking") risultava irriconoscibile. Diagnosi: `availablePhases()` leggeva la fase di *tutti* i programmi (anche eliminati) e le opzioni stampavano la sola fase.
  - Fix 1: nuove funzioni globali `phaseProgramNames(phase)` e `phaseSelectorLabel(phase)` — il VALORE dell'opzione resta la fase (nessuna migrazione dei dati), l'etichetta aggiunge il nome del programma quando differisce: "peaking · Intensità 2 ottobre-dicembre". Applicate in `workout-flow-v147.js`, `trainingContextControlsHtml`, `trainingHtml`, filtro fasi in Coach Studio → Programmi e "Fase programmazione" dell'editor schede.
  - Fix 2: `availablePhases()` esclude ora i programmi eliminati e le fasi vuote (prima una fase restava in elenco anche dopo l'eliminazione del programma).
  - Fix 3: nel modal Nuovo/Modifica programma il campo Fase ha un placeholder esplicito e una nota che spiega dove compare il valore ("è il valore che compare nel selettore Fase del workout… se lo lasci vuoto viene usato il nome della scheda").
  - Release: build/cache `v147.50-fase-scheda-label` / `atlas-app-v14750-fase-scheda-label` allineate in `index.html` (37 `?v=`), `manifest.webmanifest`, `service-worker.js`, `FIREBASE-LOGIN.md` e nei 17 test che pinnavano il token.
  - Nuovo test `tests/v14750-fase-selettore-nome-scheda.test.mjs`: etichetta con nome scheda, nessuna duplicazione quando fase = nome, esclusione programmi eliminati e fasi vuote, valore dell'opzione invariato.
- Stato test: **142/142 pass** (`node --test "tests/*.test.mjs"`).
- Blocco aperto: nessuno. Nota dati: la fase di un programma si corregge dal modal del programma (campo Fase); l'app non riscrive d'ufficio fasi o nomi per non toccare lo storico.
- Prossimo step consigliato: Fase 2 (estrazione `src/coach-ai/`) e decisione App Check (Fase 0.6).

### 6) 2026-09-23 — Scheda come fonte della scelta, Fase derivata (build v147.51)

- UUID: 0006
- Commit riferimento: working tree (sopra 21a8ec0)
- Cosa è cambiato (seguito del fix v147.50):
  - Diagnosi: il fix precedente mostrava "peaking · Intensità 2 ottobre-dicembre" solo nel selettore Fase. Il problema di fondo è che "Fase" e "Scheda" erano due `select` in concorrenza sulla stessa entità (programma), e i codici scheda (A/B/C…) si ripetono in ogni programma, quindi un elenco piatto di schede sarebbe ambiguo.
  - Nuovo modello UI (sheet-first, ordine **Scheda → Fase → Settimana**): la **Scheda** è la fonte della scelta, raggruppata per programma con `<optgroup label="nome programma">`, opzioni che mostrano **solo il nome** della scheda e con l'**id** come valore; la **Fase** è un valore derivato (readout sola lettura) che si aggiorna scegliendo la scheda. Risolve alla radice la doppia etichetta "peaking".
  - Nuova `phaseDisplayLabel(phase)`: normalizza la fase al vocabolario dei blocchi (`PHASE_CANONICAL`: Volume, Accumulo, Intensificazione, Intensità/Peaking…), riconoscendo varianti con prefisso numerico ("2.Intensificazione") o case diverso, e lasciando intatti i nomi liberi (es. "Intensità Agosto-Ottobre").
  - Nuove funzioni globali `programSheetGroups()` e `resolveManualSession()`; `currentTrainingContext()` in manuale risolve prima la scheda e ne deriva la fase (fallback su `manualPhase`/`phaseFilter`). Il warning ora è "La scheda selezionata non è più disponibile: scegline un'altra.".
  - Nuovo campo di stato `training.manualSessionId`; in `hydrateStateModel` gli stati salvati (che hanno solo `manualSessionCode`) risolvono l'id una volta in fase di load — nessuna migrazione distruttiva.
  - Aggiornati i handler: card "Contesto allenamento" (`data-training-context="session"` = id, `"phase"` resta solo come ripiego se non esistono schede), selettori legacy `#trainingSession`, pulsanti `data-v147-mode` di `workout-flow-v147.js` (imposta la prima scheda al passaggio a Manuale). Aggiornati `trainingContextControlsHtml` e `modeControlsHtml` con `.training-context-derived` / `.v147-derived-value` (CSS in `coach-studio-inline.css` e `workout-flow-v147.css`, temi chiaro/scuro).
  - Copy del modal programma aggiornata: la Fase è "il valore mostrato nel campo Fase del workout (derivato dalla scheda scelta)".
  - Release: build/cache `v147.51-scheda-fase-settimana` allineate in `app-config-v144.js`, `index.html` (tutti i `?v=`), `manifest.webmanifest`, `service-worker.js`, `FIREBASE-LOGIN.md` e nei test che pinnavano il token.
  - Test `v14745-fase-selettore-nome-scheda` esteso: raggruppamento per programma, valore = id, opzioni solo-nome, ordine Scheda→Fase→Settimana, normalizzazione fase al vocabolario, automatico con selettore scheda disabilitato. Aggiornato `program-repository` (rendering schede per nome).
- Stato test: **143/143 pass** (`node --test "tests/*.test.mjs"`).
- Blocco aperto: nessuno.
- Prossimo step consigliato: Fase 2 (estrazione `src/coach-ai/`) e decisione App Check (Fase 0.6).

### 7) 2026-09-23 — Programma-first: Fase calcolata da programma + settimana (build v147.52)

- UUID: 0007
- Commit riferimento: working tree (sopra il commit scheda-first)
- Cosa è cambiato (correzione della UX precedente):
  - Feedback utente: la Fase era rimasta identica a prima e coincideva con il nome del programma. Ordine richiesto: Modalità → Fase → Programma → Scheda → Settimana, con la Fase calcolata dall app.
  - Nuovo selettore Programma in manuale (data-training-context="program", stato training.manualProgramId) con availablePrograms().
  - La Scheda è filtrata al solo programma scelto (programSheetsFor) e mostra solo i nomi.
  - La Fase è derivata (derivedPhaseForWeek): override settimanale, poi deload ogni N settimane (programDeloadEvery, default 4), poi tipo di blocco canonico, altrimenti periodizzazione di ripiego (phaseFromWeekPosition: Volume→Accumulo→Intensificazione→Peaking).
  - Nuovo campo "Scarico ogni N settimane" nel modal Programma e programDurationWeeks() per l elenco Settimana.
  - Aggiornati resolveManualSession/resolveManualProgram, currentTrainingContext (context.program, context.programDeloadEvery), handler, selettore legacy #trainingSession, modeControlsHtml e griglie CSS.
- Stato test: 143/143 pass, incluso v14745 esteso.
- Blocco aperto: nessuno.

### 8) 2026-09-23 — Fase dai DATI del programma (stessa build v147.52, fix di logica)

- UUID: 0008
- Commit riferimento: working tree (sopra 135a00e)
- Cosa è cambiato (raffinamento della UX precedente):
  - La Fase non usa più alcuna regola generica ("ogni 4 settimane deload", "inizio=volume, fine=peaking"). Ora è derivata dai **dati del programma**, in quest'ordine: 1) piano esplicito `program.periodization.weeks`; 2) tipo settimana negli esercizi (`progression.weeks[].type`); 3) struttura ricavata dalla progressione (settimane di test di carico/RM e volume relativo); 4) tipo di blocco canonico; 5) etichetta fase del programma come ultima risorsa.
  - Rimosse `programDeloadEvery` e `phaseFromWeekPosition`: la cadenza di scarico si legge dai dati, non da una costante.
  - Nuove `programWeekProfile()` (serie programmate + marker test/RM per settimana), `inferredWeekPlan()` e `programWeekPlan()`; `phaseFromProgramData()` sostituisce la vecchia derivazione e riporta anche l'origine (`pianificazione del programma`, `struttura del programma`, `settimana della scheda`, `blocco del programma`, `programma`).
  - Editor "Periodizzazione (settimana → fase)" nel modal Programma: la tabella settimana→fase è precompilata con il piano dichiarato o quello inferito; il salvataggio scrive `program.periodization.weeks` (round-trip verificato nei test).
  - `manualPhase` ora è sincronizzato dal contesto reale (programma+scheda+settimana) in tutti i punti che lo scrivevano dalla sola scheda (`syncManualPhase`, selettore legacy `#trainingSession`, pulsanti modalità `data-v147-mode`).
  - Corretto un bug di inferenza sui dati reali: un test di calibrazione ("test 12RM") dentro una settimana a volume PIENO non è più classificato come deload; la tacca finale è peaking sull'ultima settimana con dati (non sulla durata dichiarata).
- Stato test: **143/143 pass** (`node --test "tests/*.test.mjs"`), incluso `v14745` con il nuovo caso di calibrazione.
- Blocco aperto: nessuno.

### 9) 2026-09-23 — Fase = mappatura esplicita del programma (v147.52)

- UUID: 0009
- Commit riferimento: working tree (sopra 6649831)
- Cosa è cambiato (decisione dell'utente dopo verifica sui dati reali):
  - La Fase di un programma è un **dato del programma**, non una regola: `program.periodization.weeks` è la **fonte primaria** (`PROGRAMMA → SETTIMANA → FASE`). L'inferenza strutturale resta **solo come fallback** ed è sempre marcata `estimated: true` con origine `"struttura del programma (stimata)"` / `"blocco del programma (stimata)"`.
  - Il `type` dei singoli esercizi **non entra più nel calcolo della Fase**: `sheetWeekType()` resta disponibile per altre analisi ma non è più usata da `phaseFromProgramData()`. Eliminata la costante `WEEK_TYPE_PHASE`.
  - Rimossa la funzione morta `programDeloadWeeks()`.
  - Migrazione una tantum `migrateConfirmedWeekPlans()`: fissa nei dati dei 4 programmi reali la mappatura verificata settimana per settimana. Idempotente (flag `migrations.confirmedWeekPlansV14752`), non sovrascrive mappature già dichiarate, e non si "brucia" se lo stato arriva vuoto (sync cloud in ritardo).
    - `B program 1`: 1-3 volume, 4 deload, 5-6 volume, 7 deload, 8 peaking
    - `B program 2`: 1-3 volume, 4 deload, 5-6 volume, 7 deload, 8 peaking
    - `Intensificazione`: 1-6 intensificazione, 7 peaking (7 settimane; nessun accumulo)
    - `Intensità Agosto-Ottobre`: 1-3 volume, 4 deload, 5-7 volume, 8 deload
  - UI invariata nell'aspetto: la Fase resta un valore derivato. Solo due diciture aggiornate per distinguere il dato dichiarato dall'inferenza ("dalla mappatura del programma" vs "stimata dalla struttura del programma"); l'editor Programma spiega che la periodizzazione è il dato usato.
- Metodo di verifica sui dati reali: i campi RIR/RPE/carico sono vuoti in app, quindi la classificazione è stata ricostruita da serie, ripetizioni prescritte, presenza di test RM e uniformità della riduzione di volume rispetto alla settimana precedente.
- Stato test: **144/144 pass** (`node --test "tests/*.test.mjs"`), incluso il nuovo `tests/v14752-fase-da-dati-programma.test.mjs` (40 verifiche: priorità della mappatura, type esercizio ignorato, fallback marcato stimato, reattività Programma→Settimana, indipendenza della Scheda, migrazione idempotente, assenza di riferimenti obsoleti).
- Blocco aperto: nessuno.

### 10) 2026-09-23 — Fase in fondo e dicitura rimossa (v147.53)

- UUID: 0010
- Commit riferimento: working tree (sopra 52bfd30)
- Richiesta utente dopo l'anteprima: la scritta di origine sotto la Fase ("dalla mappatura del programma" / "stimata dalla struttura del programma") creava disordine; e la Fase va spostata in fondo, dopo la Settimana.
- Cosa è cambiato:
  - Ordine dei controlli ora **Modalità → Programma → Scheda → Settimana → Fase** in `trainingContextControlsHtml` (dashboard) e `modeControlsHtml` (workout-flow-v147).
  - Rimossa la dicitura di origine dalla card: la Fase è solo il valore, senza spiegazione a schermo.
  - `phaseSource`/`phaseEstimated` restano nel modello del contesto (`currentTrainingContext`): il dato non si perde, serve ai test e a eventuali usi futuri. Sparisce solo la resa a schermo.
  - L'editor Programma (modal) mantiene la spiegazione estesa della periodizzazione: è il posto giusto per il "perché", non la card.
- Stato test: **144/144 pass**; in `v14745` l'asserzione d'ordine è aggiornata al nuovo ordine e ne aggiunge una che vieta il ritorno delle diciture.
- Blocco aperto: nessuno.

