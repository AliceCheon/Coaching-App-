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

### 10) 2026-09-23 — Fase in fondo e dicitura rimossa (v147.54)

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


## 2026-09-30 · v147.56-cursore-rir
- RIR/RPE/KG: sempre vuoti nelle 32 card IOD (72 campi RIR ripuliti, tabella + settimane di progressione); si compilano solo in allenamento.
- Settimana 1: "test 12rm, poi 1x8" (6 righe) e "test 10rm, poi 1x6" (2 righe) accanto al test, fuori dal RIR. I test di metà ciclo in settimana 4 (IOD-B4, IOD-D4) restano senza suffisso.
- Cursore stabile: render rimandati mentre si scrive (intervallo 45s, eco Firestore, salvataggi differiti, board outerHTML); flush al blur; campi di ricerca live esclusi; modal protetti.
- Prossimi passi (concordati 2026-09-30, ~02:15): progettare INSIEME una skill Genspark riutilizzabile per il flusso "import fase da Excel → bump versione a sorgente unico → suite test → push GitHub". Da studiare bene prima di implementare: cosa parametrizzare (nome fase, file Excel sorgente, bump automatico, test, push su origin/main) e cosa instead chiedere in conferma all'utente. Contesto completo nella nota memo dell'agente (sb-brain, source memo).

### 11) 2026-09-30 — Skill Genspark "coaching-app-release-fase" rilasciata (repo a d048d85)

- UUID: 0011
- Commit riferimento: d048d85 ("docs: handoff — prossima sessione: progettare skill riutilizzabile import fasi"). Working tree invariato: la skill vive fuori dal repo (profilo Genspark), nessun nuovo commit necessario.
- Cosa è cambiato:
  - Ripresa sessione verificata: albero pulito, `main` allineata a `origin/main`, build `v147.56-cursore-rir` come fonte unica, suite verde all'avvio (~3 min, 9 skip normali), fix FlexWindow/tema v147.57–63 tutti presenti nel tree.
  - Skill Genspark `coaching-app-release-fase` progettata INSIEME ad Alice e rilasciata come `coaching-app-release-fase.skill` (SKILL.md + scripts/bump_version.sh), consegnata in chat — da aggiungere al profilo con "Add to my skills".
  - Scelte di Alice: l'agente fa tutto il flusso, l'unico ok richiesto è il push; numero versione automatico (patch +1, suffisso dal nome della fase).
  - SKILL.md codifica il flusso in 7 fasi (verifica ambiente → import Excel da template `tools/import_intensita_ottobre_dicembre.py` → bump versione a sorgente unico → suite completa → checkpoint → commit → riepilogo e conferma push) con le regole dure: prescrizioni verbatim dall'Excel, RIR/RPE/KG vuoti nelle card, Fase dai dati mai seminata, MAI upload via interfaccia web di GitHub (storia v147.63).
  - bump_version.sh: bump build/cache in `app-config-v144.js` + token `vMAJOR+MINOR` allineato in `index.html` (tutti i `?v=`), `manifest.webmanifest`, `service-worker.js`, `FIREBASE-LOGIN.md` e nei test che pinnano il token, con verifica dei residui.
  - Nota onesta: il memo su sb-brain citato dall'handoff non è più presente (ricerche "skill"/"Excel"/"bump"/"fase" senza esito); il piano era comunque completo nella nota handoff di questo file.
- Stato test: suite verde all'avvio; nessuna modifica al codice dell'app in questa sessione (la skill è esterna al repo).
- Blocco aperto: nessuno. In attesa che Alice clicchi "Add to my skills" sulla card consegnata.
- Prossimo step consigliato: alla prima fase nuova reale, adattare il template import alla fase e usare la skill end-to-end (Excel → bump → test → checkpoint → conferma → push).

### 12) 2026-09-30 — Avvio parallelo + cloud-cache: dati buoni entro il primo secondo (v147.57)

- UUID: 0012
- Commit riferimento: questo commit ("v147.57: avvio parallelo e cloud-cache…"); decisione di progetto ufficializzata a 6e9a8b0 (docs/design-avvio-parallelo-cloud-cache.md).
- Sintomo: all'apertura dell'app i dati apparivano fermi a fine agosto e si aggiornavano solo dopo ~10 secondi.
- Diagnosi: avvio seriale auth → download → 3 sub-load; e la copia locale è congelata di proposito col cloud attivo (echoLocalStateQuietly è no-op), quindi la "foto" locale restava all'ultimo salvataggio pre-cloud (il 29 agosto).
- Cosa è cambiato (design §3-4):
  - Download speculativo: la get() della radice parte all'avvio con l'ultimo uid noto (l'SDK tiene la richiesta in coda finché l'auth non è pronta); loadCloudState consuma quella promise (fallback su get fresca se una corsa di sessione la fa fallire); se l'uid cambia, il risultato è scartato.
  - Sub-load programmi/blob/sedute in Promise.all: tre round-trip seriali diventano uno.
  - Cloud-cache "atlas-cloud-snap-v1" in Cache Storage: scritta dopo il download, dopo ogni snapshot remoto applicato e dopo ogni salvataggio riuscito; letta all'avvio da hydrateFromCloudSnapshotCache() e fusa con lo STESSO merge del cloud live (vincitore per meta.updatedAt), con guardie su uid, schema e stamp; lo stamp idratato viene segnato come già visto (nessun doppio merge dal primo onSnapshot).
  - Badge "Aggiorno dal cloud…" su setPremiumSaveStatus durante il download live.
  - Commento "paracadute" corretto: la copia di ripartenza del prossimo avvio è la cloud-cache, non localStorage.
- Stato test: nuova suite tests/v14757-avvio-parallelo-cloud-cache.test.mjs (idratazione con guardie uid/stamp/schema, speculativa consumata/scartata, degradazione senza Cache Storage); suite completa verde.
- Blocco aperto: nessuno.
- Push: effettuato su origin/main subito dopo la conferma di Alice (2026-09-30, ~03:26) — v147.57 pubblicata su GitHub Pages. Prossimo step: verifica sul dispositivo reale (al primo avvio la cloud-cache viene scritta; dal secondo apertura in poi i dati partano aggiornati entro un secondo e il badge passa a "Sincronizzato").

### 13) 2026-09-30 — Pre-riscaldo: anche la prima apertura dopo un deploy parte aggiornata (v147.58)

- UUID: 0013
- Contesto: dopo il push v147.57 Alice ha aperto l'app durante il deploy di Pages (build finita 03:28:43, apertura alle 03:27) e ha rivisto la foto del 29 agosto. Due cause sommate: codice vecchio ancora servito + cloud-cache mai scritta (prima sessione v147.57). La cloud-cache sopravvive ai deploy, ma il PRIMO render dell'avvio parte da localStorage (loadState, :1231) — e l'eco era volutamente no-op col cloud attivo (:4034), quindi quella fonte restava congelata.
- Fix (v147.58 "pre-riscaldo"): eco silenziosa riarmata — echoLocalStateQuietly con touch:false scrive DAVVERO STORE_KEY anche col cloud attivo (dopo ogni download e salvataggio riuscito, e dopo l'idratazione da cloud-cache :4653 → ponte). Il primo render dell'avvio parte così dall'ultimo stato visto sul cloud, alla prima apertura dopo ogni deploy futuro.
- Sicurezza: touch:false non tocca mai meta.updatedAt; il merge per stamp non può far vincere un locale più vecchio; touch:true col cloud attivo resta no-op (fingere "più nuovo" farebbe perdere al merge dati cloud legittimi); quota esaurita → false silenzioso (persistStateToLocalStorage :4064, cloud sorgente).
- Limiti fisici dichiarati: la primissima apertura dopo QUESTO deploy paga l'ultimo avvio a freddo (sul dispositivo non esiste ancora nulla di più nuovo del 29 agosto); dal secondo opening in poi — e alla prima apertura dopo ogni deploy futuro — il pre-riscaldo vale.
- Test: tests/v14758-pre-riscaldo-echo.test.mjs (T1 eco scrive senza toccare meta; T2 touch:true no-op; T3 ponte idratazione→STORE_KEY con stamp preservato; T4 quota silenziosa; guardie strutturali). Suite completa verde.
- Push: effettuato su origin/main subito dopo la conferma di Alice (2026-09-30, ~03:37) — v147.58 pubblicata su GitHub Pages. Verifica consigliata: aprire l'app DUE volte di fila; dalla seconda apertura (e alla prima apertura dopo ogni deploy futuro) il primo render parte dall'ultimo stato visto sul cloud.

### 14) 2026-09-30 — Primo paint fresco: mai più la foto vecchia all'apertura (v147.59)

- UUID: 0014
- Contesto: con la v147.58 sul dispositivo di Alice l'aggiornamento arriva più veloce, ma il PRIMO render parte ancora da localStorage (loadState :1231): la cloud-cache veniva letta DOPO il primo paint, così la foto vecchia lampeggiava a schermo prima dei dati freschi.
- Fix (v147.59 "primo paint fresco"): il primo render attende l'idratazione dalla cloud-cache (lettura locale, pochi ms) con tetto di 400ms — Promise.race nel boot dopo initFirebase. Senza cache valida (o offline, dove il locale è la fonte giusta) l'idratazione termina subito e il render parte come prima. Il wiring dello splash premium resta subito dopo: l'eventuale attesa è coperta dall'overlay.
- Scelta architetturale (chiesta da Alice: "si può togliere il locale e fare solo Firebase?"): NO al cloud-puro — il locale è il paracadute per palestra offline, pause anti-flood di Firestore (già successe) ed eventuali outage; le vere app Google tengono una copia locale ma non la mostrano mai se più vecchia. v147.59 implementa proprio questo: paracadute invisibile.
- Diagnostica: console.info su idratazione applicata ("Idratata dallo snapshot del cloud: <stamp>") e saltata ("cache assente o non valida") — verificabile da desktop.
- Test: tests/v14759-primo-paint-fresco.test.mjs (6 verifiche strutturali: race+tetto, niente fire-and-forget, aggancio a initFirebase, diagnostica, hook di scrittura invariati). Suite completa verde.
- Prossimo step: push dopo conferma di Alice.

### 15) 2026-10-07 — Editor progressioni settimana-per-settimana + metodi "Intensità:" reali (v147.92, repo a 3503208)

- UUID: 0015
- Commit riferimento: `3503208` (Merge PR #13) — build `v147.92-editor-progressioni`. PR #13: https://github.com/AliceCheon/Coaching-App-/pull/13 (mergiata).
- Cosa è cambiato:
  - **Progressioni "Intensità:" (ottobre-dicembre) riparate**: i 3 metodi davano il default **8-12** (parametri `{}`, sequenza solo nella descrizione). Ora ogni metodo ha `parameters.pattern` (`["3:10-x","2:10",...]`) applicato come **ultima parola** in `generateProgressionWeeks` (dopo la regola `linear-reps` che sovrascriveva la W1). Sequenze verificate: metodo 1 `test 12rm, poi 1x8 / 10-x / 10-8-x / 10 / 10-x / 10-8-x / 10-8-x / 10` (allineato alle **ultime schede** `Lat_mono`/`Front_squat`); metodo 2 `test 10rm, poi 1x6 / 6 / 6 / 6 / 7 / 7 / 8 / 9`; metodo 3 `8-10 / 8-10 / 8-10 / test 10 rm / 7 / 8 / 8 / 9`.
  - **Editor progressioni settimana-per-settimana**: nuova tabella in `progressionTemplateEditorHtml` (`data-progression-pattern`), binding in `bindLocallyRenderedCoachModal`, salvataggio in `saveCoachUiModal` → `parameters.pattern`. Vale su qualsiasi esercizio (indipendente dall'esercizio).
  - **Metodi personali**: `progressionTemplates()` ora include i template creati da zero (`!baseTemplateId && non-predefinito`); prima venivano scartati e non erano selezionabili.
  - **RIR/RPE vuoti ovunque** dalle schede (autoregolati in allenamento). Niente default 8-12 nei metodi Intensità:.
  - **Fix**: rimosso un errore di sintassi a fine `src/app-main.js` che bloccava il boot/il file.
  - Nuovi test: `tests/v14791-intensity-patterns.test.mjs`, `tests/v14792-editor-progressioni.test.mjs`.
- Stato test: suite completa **220 pass, 0 fail, 9 skipped** (229 test, ~8 min in background).
- Blocco aperto: smoke test CI (`.github/workflows/tests.yml`) stantio (`2026-08-31-sync-notes-v8-note-fallback`) — pre-esistente, NON correggibile (permessi `workflows`). Non bloccante.
- Vincoli ribaditi: NON toccare la scheda **"Intensità agosto-ottobre"**; NON pre-compilare la **Pendulum** (la fa Alice a mano).
- Prossimo step consigliato: **FASE 3 — animazioni + mascotte (Diva Bot)**. Agganci: `setCoachMascotState` (~10572), `playDivaBotSound` (~10106), host `#globalDivaBotHost` (~7613), asset `coach-mascot.svg`, CSS `coach-studio*.css`.

### 16) 2026-10-07 — FASE 3: Animazioni + mascotte (Diva Bot) (v147.93, branch genspark_ai_developer)

- UUID: 0016
- Base: `802cbcc` (Merge PR #14, build `v147.92-editor-progressioni`) → nuova build `v147.93-animazioni` (token `v14793`).
- Perimetro concordato: **mascotte Diva Bot + motion UI generale**, rispettando i modi `full`/`reduced`/`off` e `prefers-reduced-motion`. Tutto in `src/app-main.js` + `coach-studio-inline.css`.
- Cosa è cambiato:
  - **3.1 Transizioni**: `.screen.screen-enter` ora scatta solo sul cambio reale; nuova transizione di **route** Coach Studio (`.coach-studio-page.route-enter` + `@keyframes premiumRouteIn`); **ingresso animato dei modali** (`@keyframes coachModalIn` + backdrop `premiumFadeIn`). In `render()` una `renderKey` (schermo+route coach) evita il re-trigger ad ogni render interno.
  - **3.2 Micro-animazioni UI**: hover-lift su card/kpi/shortcut/`exercise-lab-card` (solo `@media (hover:hover) and (pointer:fine)`); "pop" del tab attivo al cambio schermata (`@keyframes navPop`). Il feedback serie (`.compact-set-done.done`) c'era già.
  - **3.3 Mascotte evoluta**: due nuovi eventi `program_saved` e `backup_exported` in `DIVA_BOT_EVENTS` + messaggi in `DIVA_BOT_MESSAGES` + agganci in `handleProgramAction("save")` e `exportBackup()`.
  - **3.4 Guardie**: `tests/v14793-animazioni.test.mjs` (transizioni, modali, micro-animazioni, nuove reazioni, degradazione reduced/off, `#globalDivaBotHost` fuori flusso).
  - Bump versione: `node tools/bump-version.mjs v147.93-animazioni` (28 file).
- Vincoli rispettati: NON toccata "Intensità agosto-ottobre"; NON pre-compilata la Pendulum; RIR/RPE vuoti; `#globalDivaBotHost` fuori flusso.
- Prossimo step consigliato: merge FASE 3 su `main`, poi **FASE 4 — Statistiche**.

### 17) 2026-10-07 — FASE 3-bis: animazioni più evidenti (non invasive) (v147.94, branch genspark_ai_developer)

- UUID: 0017
- Base: `a3dcb39` (Merge PR #15, build `v147.93-animazioni`) → nuova build `v147.94-animazioni` (token `v14794`).
- Motivo: Alice *"Non noto molto cambiamenti"*. Due cause: (1) animazioni troppo sottili (9-14px, 140-260ms); (2) il **service worker serviva ancora la v14793 dalla cache** (la cosa che rende "invisibile" un deploy su PWA).
- Cosa è cambiato (tutto dietro `premiumMotionEnabled()`/`effectiveAnimationMode()`):
  - **Transizioni più marcate**: `premiumScreenIn` 9→16px + `scale(.994)`; `premiumRouteIn` 10→18px; `coachModalIn` 14px/.982 → 22px/.955.
  - **Entrata a cascata** della route: `.coach-studio-page.route-enter > *` (`@keyframes premiumStagger`, 340ms) con delay `.02→.22s`. Parte **solo** sul cambio reale di route (`renderKey`), non ad ogni render.
  - **"Pop" mascotte** ad ogni reazione: `.coach-avatar.mascot-pop` (`@keyframes mascotPop`) innescato da `popCoachMascot()` in `setCoachMascotState()`; timer in `coachMascotController.popTimer`.
  - **Degradazioni**: in `reduced` lo stagger → `premiumFadeIn` e il pop → `animation:none`; in `off` tutto a `.01ms`.
  - **Guardie**: `tests/v14793-animazioni.test.mjs` esteso (blocchi "3-bis — entrata a cascata" e "3-bis — 'pop' della mascotte", 8 test verdi).
  - Bump versione: `node tools/bump-version.mjs v147.94-animazioni` (29 file) → cambia `CACHE_NAME` del SW, il PWA scarica subito la versione nuova.
- Vincoli rispettati: NON toccata "Intensità agosto-ottobre"; NON pre-compilata la Pendulum; RIR/RPE vuoti; `#globalDivaBotHost` fuori flusso.
- Prossimo step consigliato: merge FASE 3-bis su `main`, poi **FASE 4 — Statistiche** (3 moduli statistiche già presenti ma mai agganciati: `src/goals-stats.js`, `src/progress-charts.js`, `src/consistency-heatmap.js`).

## Checkpoint 18 — FASE 3-ter: Diva Bot movibile + espressioni (v147.95-robottino-mobile)
- **Richiesta Alice**: *"il robottino durante gli allenamenti è in un angolino in alto e non posso muoverlo a piacimento; vorrei che fosse movibile e facesse tutte le espressioni nuove."*
- **Causa radice drag**: il layer `.workout-mascot-layer` (fixed) avvolge esattamente l'anchor (~80px) → `-Math.max(0, layer.clientWidth - anchorWidth)` era **sempre 0**: la mascotte non poteva spostarsi a sinistra e lo snap cadeva nei 4 angoli.
- **Fix**: posizione **libera** in frazioni `state.ui.workoutMascotFree/XPct/YPct` (0..1, valide a resize/rotazione). Helper `workoutMascotFreeBounds/FreePixels/currentWorkoutMascotLeftTop/applyWorkoutMascotFree/persistWorkoutMascotFree`. Layer ancorato in alto a **destra** → x **negativo** (`left - maxX`). Drag riscritto (originLeft/originTop, clamp sul viewport, `--workout-mascot-x = left - maxX`). `nearestWorkoutMascotPosition` rimosso (dead code); `avoidWorkoutMascotOverlap` salta se posizione libera.
- **Espressioni**: `WORKOUT_MASCOT_SHOW_EXPRESSIONS` (tutte e 7: happy, celebrate, lifting, thinking, encouraging, warning, rest) + `WORKOUT_MASCOT_IDLE_EXPRESSIONS` (rotazione ambientale ogni ~26s, solo facce allegre/neutre = non invasiva). `showWorkoutMascotExpressionShow()` innescata da **doppio tocco** (<320ms) sulla mascotte o voce di menu "Mostra tutte le espressioni". Tocco singolo = nessuna azione. Tocco lungo (620ms) = menu su **ogni** dispositivo.
- **Menu**: aggiunte voci "Mostra tutte le espressioni" e "Rimetti in alto a destra" (`data-workout-mascot-expressions/reset`). Rebind-guard `layer.dataset.workoutMascotBound` (l'HTML di Allenamento si ricrea often). `render()` → `stopWorkoutMascotExpressions()` fuori dall'Allenamento.
- **CSS**: `.workout-mascot-anchor[data-side="left"]` → bubble/menu a sinistra quando la mascotte è nella metà sinistra.
- **Guardia test**: `tests/phase23-floating-workout-mascot.test.mjs` esteso (freeBounds, persistWorkoutMascotFree, originLeft, SHOW_EXPRESSIONS, show expression, data attrs, data-side=left).
- **Suite**: `node --test tests/*.test.mjs` → **237 test, 228 pass, 0 fail, 9 skipped, EXIT:0**.
- **Bump**: `node tools/bump-version.mjs v147.95-robottino-mobile` (29 file) → nuovo `CACHE_NAME` del SW.
- Vincoli rispettati: NON toccata "Intensità agosto-ottobre"; RIR/RPE vuoti.
- Prossimo step: **FASE 4 — Statistiche** (confermare scope con Alice; candidato = agganciare `src/goals-stats.js`, `src/progress-charts.js`, `src/consistency-heatmap.js`).

## Checkpoint 19 — FASE 3-ter-bis: Diva Bot contestuale + menu che si chiude (v147.96-robottina-compagnia)
- **Lamentele Alice**: (1) le espressioni partivano *tutte assieme* con un gesto → le vuole *in base a quello che scrive*, e di "compagnia" mentre è sull'app; (2) il menu (popup) non si chiudeva più.
- **Espressioni contestuali**: già veicolate da `DIVA_BOT_EVENTS` (serie→happy, PR/workout→celebrate, load_up→lifting, recovery/rir→warning, analysis→thinking, idle→rest). Niente più "show" forzato di tutte le facce.
- **Compagnia**: `WORKOUT_MASCOT_COMPANIONSHIP` + `start/stop/reactWorkoutMascotCompanionship()`. Rotazione ogni 32–58s, **solo se `idle`**, salta mentre digiti (input/textarea/select). Doppio tocco = 1 faccia + 1 saluto. Rimosse `WORKOUT_MASCOT_SHOW_EXPRESSIONS`, `WORKOUT_MASCOT_IDLE_EXPRESSIONS`, `showWorkoutMascotExpressionShow()` e il pulsante "Mostra tutte le espressioni".
- **Menu che si chiude**: `pointerdown` capture fuori dal menu (`menu.contains(event.target)` → ignora) + `Escape`.
- **Suite**: `node --test tests/*.test.mjs` → **237 test, 228 pass, 0 fail, 9 skipped, EXIT:0**.
- **Bump**: `node tools/bump-version.mjs v147.96-robottina-compagnia` (29 file).
- Vincoli rispettati: NON toccata "Intensità agosto-ottobre"; RIR/RPE vuoti.
- Prossimo step: FASE 4 — Statistiche (confermare scope con Alice).
