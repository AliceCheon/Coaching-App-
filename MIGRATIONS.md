# Migrazioni Fase 19

## v4 → v5

`migrateV4ToV5()` aggiunge valori sicuri senza eliminare o rinominare campi precedenti:

- `training.activeWorkout = null` quando assente;
- `training.workoutProPreferences` con permessi disattivati;
- `meta.schemaVersion = 5`.

`hydrateStateModel()` completa i default anche per backup vecchi o parziali. Il formato di esportazione esistente non viene sostituito: i backup precedenti attraversano la pipeline di migrazione già presente.

La riparazione delle progressioni importate non forza più Recovery Mode quando mancano dati non essenziali: conserva lo stato migrato e registra un avviso di audit.

## Correzione dati Alice

`correctAliceWorkoutF16Jul2026()` corregge la registrazione confermata della Scheda F (anche se il codice storico contiene il numero settimana) quando la data normalizzata è `2026-07-20`. La nuova data è `2026-07-16`, anche sulle righe esercizio. Timestamp tecnici di salvataggio/sync non vengono falsificati.

La correzione è idempotente per condizione: viene ricontrollata anche dopo un merge cloud tardivo, ma una voce già al 16 luglio non corrisponde più al filtro e non viene toccata di nuovo. `migrations.aliceWorkoutF16Jul2026Corrected` conserva il conteggio delle correzioni applicate.

Il controllo viene ripetuto dopo il recupero del journal locale e dopo i merge cloud iniziale/realtime, perché una safety copy o una copia remota può essere reinserita nello storico dopo la prima idratazione dello stato.

L'Archivio allenamenti applica infine lo stesso controllo prima del rendering e salva subito l'eventuale correzione: questo copre anche journal o callback asincrone arrivate dopo un render precedente.

## Compatibilità

- Nessuna funzione dichiarata della Fase 18 è stata rimossa: 490 su 490 presenti.
- Le sessioni storiche continuano ad aprirsi con i campi mancanti trattati come opzionali.
- Warm-up, tecniche, gruppi e audit sono campi additivi.
- Il salvataggio definitivo usa ancora il repository e la sync cloud esistenti.
# Fase 20A — migrazione compatibile schema 5

- `phase20AProgramming = 1` inizializza in modo idempotente il nodo opzionale `programming`.
- Backup schema 4/5 senza il nodo vengono caricati con default conservativi.
- Nessuna seduta, scheda, progressione o decisione precedente viene rimossa.
- Nessun incremento di schema è necessario perché l'estensione è opzionale e retrocompatibile.
