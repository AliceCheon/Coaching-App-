# Differenze tra v112 Fase 19 e v113 Fase 19.1

| Area | v112 | v113 Fase 19.1 |
|---|---|---|
| Modalità | Flusso d'ingresso diverso, renderer sostanzialmente condiviso | Cinque renderer e un dispatcher distinti |
| Pro | Una serie alla volta | Confermato, con marker DOM dedicato |
| Compatta | Non realmente distinta | Tutte le serie dell'esercizio corrente e prossimi esercizi |
| Rapida | Non realmente distinta | Tutti gli esercizi e tutte le serie in forma minima |
| Libera | Avvio dedicato ma composizione limitata | Composizione, riordino, gruppi, serie e sessione vuota |
| Cambio vista | Non completo | Pro/Compatta/Rapida senza ricreare la sessione né perdere dati o timer |
| Diva Bot | Elemento della pagina sottostante | Overlay separato che riusa il bot esistente, trascinabile e persistente |
| Build/cache | v112 / phase19.10 | `v113-phase19.1` / `atlas-app-v113-phase19.1` |
| Schema dati | 5 | 5, invariato |

## Compatibilità verificata

- Confronto strutturale delle dichiarazioni nominate: 666 nella base v112, 687 nella build v113, 0 mancanti e 21 aggiunte.
- Nessuna cancellazione o trasformazione distruttiva dei dati.
- Lo storico Logbook e il journal della sessione attiva mantengono i percorsi di lettura e scrittura esistenti.
- Il salvataggio finale continua a passare dalla conferma; `viewMode` viene registrata come informazione aggiuntiva.
- La migrazione da backup schema 4 verso schema 5 resta disponibile.
