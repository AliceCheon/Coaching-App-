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