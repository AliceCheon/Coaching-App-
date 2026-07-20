# Schema dati v5

Lo schema v5 è additivo. Le sezioni precedenti (`profile`, `metrics`, `nutrition`, `body`, `programs`, `coach`, `quiz`, `ui`, `training.sessions`) restano compatibili.

## `training.activeWorkout`

```text
id, schemaVersion, programId, workoutId, sessionCode, sessionName,
phase, week, dateInput, mode,
startedAt, resumedAt, pausedAt, completedAt,
elapsedTime.pausedSeconds,
currentExerciseId, currentSetId, status,
exercises[], exerciseGroups[],
notes, sessionRpe, feelings, pain,
readinessSnapshot,
recoveryTimers, exerciseTimers,
pendingChanges[], undoStack[], audit[],
autosaveVersion, updatedAt,
plannedOrder[], actualOrder[],
suggestionPreferences,
wakeLockStatus, voiceStatus
```

Stati validi: `idle`, `active`, `paused`, `interrupted`, `completed`, `discarded`, `recovery`.

Ogni esercizio conserva identità originale, sostituzione, target, ordine pianificato/effettivo, storico utile e serie distinte. Ogni serie contiene tipo (`working` o `warmup`), target, valori eseguiti, stato, note e una eventuale tecnica di intensità con segmenti espliciti.

I gruppi hanno `type`, `exerciseIds`, `rounds`, recuperi tra esercizi/round e `orderMode`. I timer salvano `endsAt` e ricalcolano il residuo con `Date.now()`.

## Preferenze

`training.workoutProPreferences` contiene incrementi per bilanciere, manubri, macchine, cavi, corpo libero e unilaterali, oltre a Wake Lock, voce, suono e notifiche, tutti disattivati per default.

## Persistenza di sicurezza

- Stato principale: repository esistente di Barbell Diva.
- Journal attivo: `barbell-diva.active-workout.journal.v1`.
- Copia pre-conferma/finale: `barbell-diva.completed-workout.safety.v1`.
- Il journal non crea una sessione definitiva in `training.sessions`.
