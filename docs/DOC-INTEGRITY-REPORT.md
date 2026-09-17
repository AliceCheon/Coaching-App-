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

Rimossi da `src/app-main.js` con asserzioni preventive e invariante byte-esatto
(**−5.734 byte**, righe 14.377 → 14.366, graffe rimosse in modo coerente 63/63):

| Rimosso | Righe originali | Motivo |
|---|---|---|
| `coachAi2PageHtml` corpo irraggiungibile | 8310–8318 | dopo un `return` alla riga 8309 |
| alias `coachAi2ExerciseTableHtml=…FilteredHtml` | 8164 | travestimento: un nome puntato a un'altra funzione |
| `coachAi2ExerciseTableHtml` originale | 8156 | sovrascritto dall'alias prima di ogni chiamata |
| `coachAi3PreviewLegacyHtml` | 8198–8201 | definita e mai chiamata |
| `coachAiPriorityCardsHtml` | 8263–8267 | definita e mai chiamata (esiste la V2) |

Inoltre la funzione viva è stata rinominata da `…FilteredHtml` a `coachAi2ExerciseTableHtml`,
eliminando il travestimento senza cambiare comportamento.

### ⚠️ Bug funzionale rilevato (NON corretto: richiede una decisione)

L'handler **vivo** `data-ai2-action` / `applyDefaultProgression` (`src/app-main.js` ~11212)
imposta `coachProgramUi.ai2Preview` e chiama `render()`, ma il markup che **disegna** quel modal
è nel blocco irraggiungibile (8311–8312). Stessa situazione per:

- `ai2Undo` (markup solo a 8314) → **nessun undo**
- `data-ai2-window` (markup solo a 8315) → **selettore finestra assente**
- `data-ai2-status` (markup solo a 8318) → handler morto

Effetto: cliccando "applica progressione" su una card prioritaria non appare alcuna conferma,
il flusso si interrompe in silenzio. Il blocco 8310–8318 è stato **deliberatamente conservato**
come riferimento per il ripristino: cancellarlo consoliderebbe il bug.

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
