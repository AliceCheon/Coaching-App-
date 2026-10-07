# System Patterns — Coaching-App

Questo file raccoglie i pattern e le convenzioni attualmente in uso nel progetto. Deve essere aggiornato quando un pattern diventa stabile o quando un vecchio pattern viene depreso.

## Identified patterns / conventions

### Motore Progressioni (app-main.js) — pattern settimanale esplicito
- `PROGRESSION_TEMPLATE_LIBRARY` (~1602): factory `progressionTemplate(id,name,desc,category,suitableFor,kind,parameters,extra)`.
- I metodi "Intensità:" (ottobre-dicembre) usano `parameters.pattern`: array di
  stringhe `"<serie>:<reps>"`, una per settimana (es. `"3:10-8-x"`, `"1:test 12rm, poi 1x8"`).
- `generateProgressionWeeks(exercise, templateId, duration, parameters, existing)` (~1668):
  il `pattern` è applicato **come ultima parola**, DOPO tutte le regole del `kind`.
  Regola d'oro: un `pattern` esplicito NON deve mai essere sovrascritto (la vecchia
  regola `linear-reps` sulla W1 lo cancellava → bug 8-12).
- Indipendenza dall'esercizio: con un `pattern` il risultato è **identico** per
  qualunque esercizio (anche esercizi senza reps proprie, es. Pendulum creato a mano).
- RIR/RPE non vengono mai pre-compilati: `generateProgressionWeeks` parte da
  `parseRir("")` e `exercisePrescriptionForTrainingWeek` forza `rir:""`.
- **Editor**: `progressionTemplateEditorHtml` (~10729) mostra la tabella
  `data-progression-pattern` (Serie/Ripetizioni per settimana); binding in
  `bindLocallyRenderedCoachModal`; salvataggio in `saveCoachUiModal` (~14802) →
  `parameters.pattern`.
- `progressionTemplates()` (~1620) = predefiniti (con eventuali override) **+**
  metodi personali creati dall'utente (prima venivano scartati).

### Sync queue pattern
- Esiste una coda di operazioni con stato esplicito: pending, syncing, synced, failed, conflict.
- Ogni operazione ha operationId, entityId, operationType, createdAt, attempts, error e lastAttemptAt.
- Le transizioni avvengono tramite patch esplicita con marker di stato, non con mutazioni libere.
- C'è una log di audit separata per tracciare le transizioni di stato e gli eventi correlati.
- C'è un fallback in-memory quando non è disponibile storage.

### Modularizzazione / HTML row helpers
- Gli helper per la costruzione di righe HTML inline sono stati modularizzati recentemente.
- I test seguono la stessa linea di modularizzazione: dove possibile, helpers estratti e test affiancati.

## Da non fare / limiti attuali

- Evitare di mescolare logica di stato della coda con flusso di rendering UI.
- Evitare di mutare lo stato della coda senza passare per i path ufficiali (patch / enqueue / mark*).

## Ricette correlate

- Vedi development_recipes.md per il modo consigliato di aggiungere nuovi test e di toccare la sync queue.