# Coaching-App Memory Bank

Questa memory bank ha lo scopo di mantenere il contesto del progetto in modo che, se si apre una nuova chat, il sistema “ricordi” lo stato attuale, l'ultima commit, le aree critiche e le decisioni prese.

Struttura attuale:
- `docs/memory-bank/activeContext.md`
- `docs/memory-bank/systemPatterns.md`
- `docs/memory-bank/development_recipes.md`
- `docs/memory-bank/progress_log.md`
- `docs/memory-bank/checkpoint.md`

Checkpoint automatici:
- Ogni tot task/commit viene aggiunto un checkpoint in `activeContext.md` e `progress_log.md`.
- Il checkpoint include: ora, commit corrente, stato delle aree test (measurement rig / records / logging), eventuali blocchi aperti, decisioni recenti, prossimi step consigliati.

Obiettivo:
- Ridurrequanto serve contesto passato nelle chat successive mantenendo il filo di quanto fatto nelle sessioni precedenti.