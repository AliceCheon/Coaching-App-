# Report di integrità della documentazione — Barbell Diva

Data: 17/09/2026 · Da commit `7b828dd` (punto di ripristino) → bonifica Fase 0/1

## In sintesi

Uno script di spostamento file (probabile *off-by-one* in un indice) ha scritto sui file
sbagliati: **molti documenti `.md`/`.txt` di root contenevano il contenuto di un altro file**.
La history Git non aiuta: esiste un solo commit ("grafted" `41379d6`), quindi non c'è uno
storico da cui recuperare i testi originali. Inoltre le copie in `docs/history/` erano
**byte-identiche** a quelle corrotte in root, quindi non erano un backup utile.

## Prove raccolte (hash SHA256 byte-per-byte)

### A. Documenti che erano copie esatte di file di codice intatti

Il testo del documento è andato perso, ma il codice esiste ed è integro:
la rimozione non perde nulla.

| Documento | Era identico a | Azione |
|---|---|---|
| `FIREBASE-LOGIN.md` | `decision-engine.js` | rimosso → **riscritto correttamente** |
| `FIRESTORE-RULES-ACTIVE.txt` | `decision-rules.js` | contenuto recuperato (vedi C) |
| `TEST-REPORT-PHASE19.2.md` | `sync-reliability.js` | rimosso |
| `COACH-VIDEO-MAP.md` | `coach-mascot.svg` | rimosso |

### B. Duplicati esatti di `docs/history/` (35 file)

`CHANGELOG-*`, `README-*`, `TEST-REPORT-*`, `NOVITA-V5*`, `README-fixes-v142.txt`,
`DIFFERENCES-PHASE19.1.md`, `FUNCTIONS-PHASE20A.md`, `LIMITS-PHASE20A.md`,
`MODIFICHE-V144.md`, `PERFORMANCE-AUDIT-COACH-v144-PHASE1.md` (35 in totale).

→ Copie rimosse da root. **Contenuto preservato** in `docs/history/`.

### C. Recupero riuscito: rotazione a 3 file

I contenuti erano identificabili senza ambiguità dalla loro intestazione: riassegnati
**byte per byte**, con verifica di hash a conferma.

| File | Conteneva | Contiene ora | Contenuto corretto proveniente da |
|---|---|---|---|
| `MIGRATIONS.md` | "AVVIO SICURO" | `# Migrazioni Fase 19` | `PERFORMANCE-AUDIT-COACH-v144-PHASE1.md` |
| `LEGGIMI-AVVIO-SICURO.txt` | "REGOLE FIRESTORE" | `BARBELL DIVA - AVVIO SICURO` | `MIGRATIONS.md` |
| `FIRESTORE-RULES-ACTIVE.txt` | `decision-rules.js` | `REGOLE FIRESTORE ATTIVE` | `LEGGIMI-AVVIO-SICURO.txt` |

Verifica: `hash(nuovo LEGGIMI) == hash(vecchio MIGRATIONS.md)` ✓, e così per gli altri due.

### D. Contenuto unico preservato con nome onesto

`DATA_SCHEMA_V5.md` **non conteneva lo schema dati**: erano 389 righe di CSS, uno snapshot di
`coach-studio.css` (che oggi ne ha 430). Non esiste altrove nel repository.
Il file è stato spostato in `docs/history/coach-studio-css-snapshot-phase19.css`.

## Ancora da verificare (non toccati, per non indovinare)

| File | Contenuto attuale | Nota |
|---|---|---|
| `COACH-VIDEO-STRUCTURE-REPORT.md` | CSS | il titolo originale "# Coach Studio - struttura video" si trova in `docs/history/DIFFERENCES-PHASE19.1.md` — recupero possibile, da confermare |
| `PHASE24-COACH-AI3-REPORT.md` | "# File modificati v144" | nome e contenuto non coerenti |
| `PULIZIA-CODEX-INVENTARIO.md` | "# Coach v144 - Fase 1: audit render globale" | da confermare |

## Documento dello schema dati

Dopo lo spostamento di `DATA_SCHEMA_V5.md` non esiste più un documento di schema.
**Lo schema vero è ricavabile dal codice** (fonte di verità):

- `DATA_SCHEMA_VERSION = 10` — `src/app-main.js:1031`
- `BACKUP_SCHEMA_VERSION = 1` — `src/app-main.js:1032`
- Catena migrazioni `SCHEMA_MIGRATIONS` `1→2 … 9→10` — `src/app-main.js:1039`
- Chiavi di stato di primo livello (`baseState`, da riga 1041):
  `profile, metrics, body, athleteIntelligence, masterExerciseLibrary, knowledgeEngine,
  coachAi3, programs, training, programming, coach, quiz`
- Chiave di storage locale: `alice-method-app.v8`

→ Ricostruzione di `DATA_SCHEMA_V10.md` consigliata come lavoro successivo, leggendo il codice.

## Pulizia della zona CoachAI (Fase 1, completata)

Rimossi da `src/app-main.js` con asserzioni preventive e invariante byte-esatto:
**21 righe di codice morto** eliminate, **9 righe** aggiunte per ripristinare la funzione rotta.
Bilancio netto: **−10.657 byte**, righe 14.377 → 14.365, graffe sempre bilanciate dopo ogni passo.

| Rimosso | Righe originali | Motivo |
|---|---|---|
| `coachAi2PageHtml` corpo irraggiungibile | 8310–8318 | dopo un `return` alla riga 8309 |
| alias `coachAi2ExerciseTableHtml=…FilteredHtml` | 8164 | travestimento: un nome puntato a un'altra funzione |
| `coachAi2ExerciseTableHtml` originale | 8156 | sovrascritto dall'alias prima di ogni chiamata |
| `coachAi3PreviewLegacyHtml` | 8198–8201 | definita e mai chiamata |
| `coachAiPriorityCardsHtml` | 8263–8267 | definita e mai chiamata (esiste la V2) |
| handler `data-ai2-status` | ~11196 | markup emesso solo dal blocco irraggiungibile |

Inoltre la funzione viva è stata rinominata da `…FilteredHtml` a `coachAi2ExerciseTableHtml`,
eliminando il travestimento senza cambiare comportamento.

### ✅ Bug funzionale rilevato e corretto

L'handler **vivo** `data-ai2-action` / `applyDefaultProgression` imposta `coachProgramUi.ai2Preview`
e chiama `render()`, ma il markup che **disegnava** quel modal era finito nel blocco irraggiungibile.
Conseguenza: cliccando "applica progressione" su una card prioritaria non appariva alcuna conferma
e il flusso si interrompeva in silenzio. Lo stesso valeva per:

- `ai2Undo` → **nessun undo** disponibile
- `data-ai2-window` → **selettore della finestra performance assente**

**Ripristino effettuato**, riusando solo classi CSS già esistenti (nessun CSS nuovo):

| Ripristinato | Come |
|---|---|
| Modal di conferma | nuova `coachAi2ProgressionPreviewHtml()`, richiamata in `coachAiWorkspaceHtml` |
| Pulsante di annullamento | card `data-ai2-undo` mostrata solo quando c'è una modifica da annullare |
| Selettore finestra performance | `<select data-ai2-window>` (3/5/8 rilevazioni), collegato all'analisi |
| Handler `data-ai2-status` | **rimosso**: superato dal menu `data-ai-ignore-mode` delle card V2 |

Verifica: ogni handler `data-ai2-*` ha ora il suo markup vivo (≥2 occorrenze = markup + handler).

### Nota: `insightHistory` non è mai popolato

`state.athleteIntelligence.insightHistory` viene **letto** dall'analisi (righe 8149, 8173) ma era
**scritto solo** dall'handler `data-ai2-status`, ora rimosso perché irraggiungibile. Risultato: la
cronologia passata all'analisi è sempre vuota. Non è una regressione (era già così), ma è una
funzionalità da ricollegare: le azioni "Ignora / Più tardi / Archivia" scrivevano lì.

## Altro codice morto trovato (non rimosso: fuori dal perimetro CoachAI)

30 funzioni definite e mai usate in `src/app-main.js`:
`cancelPremiumMetricAnimations, canonicalExerciseLibraryKey, cloudErrorLogSummary,
coachAiRuleReviewSnapshot, coachBoardHiddenColumnClasses, coachBuilderFeedback,
coachBuilderVolumeHtml, coachCreatedSheetPreviewHtml, coachFeedbackBoardHtml,
coachInlineGroupMenuHtml, coachLegacyHtml, coachLiveVolumeHtml, coachStudioDashboardHtml,
coachQuizReviewHtml, coachWeekCellHtml, createBackupPayload, currentDate, decisionReasonText,
getDisplayExerciseName, importBackupSnapshot, libraryItems, logbookSessionVolume, missionHtml,
refreshCloudIfSynced, restorePreV55Backup, restoreWeekConsolidationBackup, sessionFingerprint,
weightChartHtml, workoutCoachProgressMessage, workoutHasNewPersonalRecord`

Più 4 funzioni usate **solo dai test** (rimuoverle romperebbe la suite):
`coachProgramArchiveHtml`, `downloadCloudToThisDevice`, `scheduleAutomaticBackup`,
`uploadThisDeviceToCloud`.

> Nota metodologica: una prima scansione classificava `coachAiRuleReviewSnapshot` come
> "usata altrove". Era un **falso positivo**: i riferimenti erano nei backup HTML in `backup/`
> (copie complete del vecchio codice da 1,2 MB). Escludendo `backup/` e `docs/` il verdetto
> è corretto.

## Esito della suite di test (Node 24.21.0, replica dei passi CI)

Node non era installato sulla macchina: è stato usato **Node 24.21.0 portable** in `%TEMP%`
(stessa major della CI), senza installazioni di sistema e senza toccare il repository.

| Passo CI | Esito |
|---|---|
| `node --check` su tutti i `*.js` e `src/*.js` | ✅ **0 errori di sintassi** |
| `node --test` | ️ **159 pass / 3 fail** su 162 |

### I 3 fallimenti sono PREESISTENTI, non causati da questa bonifica

**Prova**: i test sono stati rieseguiti in un `git worktree` separato sul commit **`7b828dd`**
(istantanea del WIP, con `src/app-main.js` da 2.094.611 byte **non ancora ripulito**):

| Test | Sul baseline `7b828dd` | Dopo la bonifica |
|---|---|---|
| `tests/coach-ai-classification.test.mjs` | ❌ FALLITO | ❌ FALLITO |
| `tests/phase14-exercise-lab-editor.test.mjs` | ❌ FALLITO | ❌ FALLITO |
| `tests/phase17-mobile-cloud-coach-fluidity.test.mjs` | ❌ FALLITO | ❌ FALLITO |

Fallendo **identicamente anche senza le modifiche**, i tre fallimenti appartengono al lavoro
in corso già presente nel working tree (3 dei 7 file modificati erano proprio questi test).

### Cause individuate

| Test | Messaggio | Area |
|---|---|---|
| `coach-ai-classification` | `RDL simili ma non assoluti` — attende `specific-overlap` con confidenza `media` | la regola **esiste ed è attiva** (`src/app-main.js:10139`), quindi è un disallineamento fra comportamento dell'app e attesa del test |
| `phase14-exercise-lab-editor` | `TEST 7 Libreria solo nel Coach` | editor esercizi |
| `phase17-mobile-cloud-coach-fluidity` | `Programmi non separati nel cloud` | sincronizzazione cloud |

⚠️ **Non sono stati "aggiustati"**: modificare l'app o le attese per farli passare senza conoscerne
l'intento rischierebbe di mascherare bug reali (in particolare `Programmi non separati nel cloud`
potrebbe indicare un problema di sincronizzazione con impatto sui dati). Vanno trattati come
lavoro successivo, con una decisione esplicita.

Di conseguenza **la CI su questo push risulterà rossa** per questi 3 test, e non per la bonifica.
