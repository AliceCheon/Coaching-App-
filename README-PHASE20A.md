# Barbell Diva v115 — Fase 20A

Build tecnica del motore di programmazione intelligente. La base è la build finale approvata v114 Fase 19.2; la Fase 20B non è inclusa.

## Cosa contiene

- `programming-engine.js`: modulo ES puro, deterministico, non mutante e senza API esterne.
- Normalizzazione di programmi, sedute, esercizi e serie, con riferimenti ai dati originali.
- Analisi di comparabilità, aderenza, trend, plateau, regressione, fatica e anomalie.
- Suggerimenti prudenziali con confidenza, evidenze, limiti, simulazione e validazione.
- Cache derivata invalidabile e persistenza delle sole decisioni utente.
- API pronta per la UI della futura Fase 20B.
- Correzione mobile Workout Pro: modalità Pro compatta entro una schermata tipica 390 × 844, mantenendo target tattili da 44 px.

## Avvio semplice

Aprire `Avvia-Barbell-Diva.cmd`. La pagina corretta è `index.html?v=115-phase20a`.

Schema dati: 5, invariato. Cache PWA: `atlas-app-v115-phase20a`.

## Sicurezza

Il motore non modifica automaticamente schede, storico o progressioni. `accepted`, `modified`, `ignored` e `reverted` sono decisioni registrate, non applicazioni automatiche. Il backup v114 pre-Fase20A è separato dal pacchetto.
