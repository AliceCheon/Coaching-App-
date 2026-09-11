# System Patterns — Coaching-App

Questo file raccoglie i pattern e le convenzioni attualmente in uso nel progetto. Deve essere aggiornato quando un pattern diventa stabile o quando un vecchio pattern viene depreso.

## Identified patterns / conventions

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