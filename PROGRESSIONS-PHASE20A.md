# Progressioni Fase 20A

## Supportate con strategia esplicita

1. `double-progression` — aumenta il carico solo dopo consolidamento del limite alto; altrimenti consolida le ripetizioni.
2. `linear-load` — incremento di carico con target, aderenza e margine sufficienti.
3. `linear-reps` — modifica solo le ripetizioni.
4. `linear-sets` — aggiunge al massimo una serie quando il segnale è stabile.
5. `rir-progression` — modifica solo il target RIR.
6. `top-set-backoff` — top set e back-off restano segmenti distinti.
7. `volume-progression` — modifica prudenziale del numero di serie.
8. `intensity-progression` — incremento di carico vincolato all'aderenza.
9. `undulating` — avanza la struttura settimanale già definita senza inventare valori.
10. `pyramid` — conserva la struttura e propone soltanto l'avanzamento previsto.
11. `reverse-pyramid` — conserva la struttura e propone soltanto l'avanzamento previsto.
12. `density` — riduce il recupero di 10 secondi senza cambiare insieme altre dimensioni.
13. `recovery-decreasing` — riduzione prudente del recupero.
14. `maintenance` — mantiene la prescrizione.
15. `deload` — simula riduzione di serie/carico e aumento del margine, senza applicazione automatica.

## Non supportate

- `custom`: il motore restituisce `unsupportedProgression` e non inventa regole.

## Regole conservative comuni

- Una prestazione negativa isolata non diventa automaticamente regressione.
- Plateau e regressione richiedono più sedute comparabili.
- Dolore, fatica, readiness bassa, sedute incomplete, sostituzioni e anomalie riducono confidenza o bloccano la progressione.
- Warm-up, drop set, rest-pause, cluster, myo-reps e parziali non vengono mescolati alle serie normali; top set e back-off restano analizzabili ma distinti.
