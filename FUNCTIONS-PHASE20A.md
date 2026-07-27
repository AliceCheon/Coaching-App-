# Funzioni Fase 20A

Confronto automatico tra v114 Fase 19.2 e v115 Fase 20A:

- 496/496 funzioni dichiarate precedenti conservate.
- 0 funzioni precedenti mancanti.
- 46 funzioni tecniche aggiunte: 44 nel motore isolato e 2 per il collegamento allo stato dell'app.

API pubblica preparata per la Fase 20B:

- `getProgrammingSuggestions(options)`
- `getExerciseAnalysis(exerciseId, options)`
- `getWeeklyAnalysis(week, options)`
- `getProgramAnalysis(programId, options)`
- `getSuggestionEvidence(suggestionId)`
- `getSuggestionSimulation(suggestionId)`
- `refreshProgrammingAnalysis(options)`
- `invalidateProgrammingAnalysis(filter)`
- `markSuggestionViewed(suggestionId)`
- `recordSuggestionDecision(suggestionId, decision, details)`

La UI 20B potrà consumare queste API; non è stata anticipata in questa build.
