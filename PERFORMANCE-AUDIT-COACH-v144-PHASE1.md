# Coach v144 - Fase 1: audit render globale

Data audit: 2026-07-27. Build analizzata: `Barbell-Diva-versione-144-coach-rebuild`.

## Video osservato

La registrazione `Registrazione dello schermo 2026-07-27 102416.mp4` dura circa 107 secondi ed e stata osservata interamente. La sequenza mostra l'editor di una settimana con due giornate, apertura di un menu azione/progressione, creazione di un gruppo/circuito, ritorno alla lista, apertura di Aggiungi esercizio e apertura di Statistiche prima del ritorno alla lista Programmi. Le schermate cambiano dopo le azioni, ma il feedback non e proporzionato all'operazione: l'intero editor/lista viene ricostruito anche per stato locale.

## Inventario completo

Nel perimetro Coach compreso tra le funzioni di navigazione/editor/modal sono state trovate **155 occorrenze di `render();`**. Le righe sono quelle della build prima dell'intervento e servono come baseline:

```text
11043, 11306, 11816, 11826,
14010, 14014, 14015, 14016, 14051, 14059, 14060, 14067, 14069, 14070, 14071, 14072, 14073, 14074, 14075, 14076, 14078, 14079, 14082, 14083, 14085, 14086, 14087, 14088, 14091, 14093, 14095, 14105, 14130, 14132, 14135,
14200, 14202, 14207, 14251, 14256, 14264, 14268, 14274, 14280, 14281, 14287, 14289, 14294, 14299, 14310,
14322, 14323, 14324, 14325, 14330, 14333, 14339, 14344, 14350, 14352, 14358, 14360, 14375, 14380, 14397,
14430, 14441, 14448,
14571, 14581, 14589, 14596, 14603, 14611, 14619, 14628, 14635, 14643, 14663, 14712, 14720, 14727, 14731, 14743, 14760, 14771, 14772, 14773, 14781, 14785, 14792,
14812, 14819, 14822, 14828, 14833, 14843, 14845, 14874, 14895, 14917, 14931, 14938, 14945, 14970, 14976, 14982, 14989, 14993,
15000, 15007, 15029, 15037, 15043, 15049, 15057, 15063, 15069, 15077, 15113, 15122, 15124, 15126, 15148, 15155, 15156, 15157, 15158, 15159, 15160, 15161, 15167, 15177, 15182, 15184, 15185, 15186, 15194, 15202, 15209, 15213, 15231, 15239, 15288, 15322, 15325, 15342, 15796, 15917, 15920, 15929, 15938, 15951, 16252, 16293
```

## Decisione per area

| Area e righe | Motivo attuale | Decisione |
|---|---|---|
| `11043`, `14294`, `14299`, `14310`, `14330`, `14375`, `14380`, `14430`, `14441`, `14448` | routing, apertura pagina o cambio sezione Coach | mantenere solo per cambio pagina; evitare se lo stato cambia dentro l'editor |
| `11306`, `14051`, `14055-14067`, `14069` | form atleta/strategia e collegamenti | mantenere per pagine form non-editor; sostituire nel drawer/editor con patch del pannello |
| `11816`, `11826`, `14251`, `14256`, `14264`, `14268`, `14771-14773`, `14812` | gruppi, copia, riordino, filtro e progressione | sostituire con aggiornamento della card/riga/gruppo interessato; il salvataggio resta separato |
| `14070-14135` | Coach AI, analisi e preview | fuori dal percorso editor osservato; rendere locale solo quando il pannello AI e gia montato |
| `14200`, `14202`, `14207`, `14274`, `14280-14289` | sidebar, modal, questionari, impostazioni | modal/sidebar: portal locale; impostazioni/questionari: render pagina accettabile fuori dall'editor |
| `14571-14760` | editor schede, campi, nome, settimana, azioni esercizio | critico: sostituire con patch di header, tab, giornata o riga; nessun render globale per un campo |
| `14819-14845` | libreria progressioni e vista editor | critico per menu/progressione; patch del badge e del pannello, render globale solo cambio vista |
| `14874-14945` | toolbar, tab Coach, overview e statistiche | toolbar/riga locale; cambio tab puo cambiare pagina e puo mantenere render |
| `14970-15007`, `15029-15077` | libreria tecnica, atleta, programmi e schede | modali e filtri locali; cambio programma/scheda e cambio pagina possono renderizzare |
| `15122-15239` | modali, AI, ricerca libreria, inserimento e modifica esercizio | critico: portal locale per modal, lista risultati riconciliata, riga aggiornata dopo inserimento |
| `15288-15342` | conferme e salvataggi editor | sostituire per conferme locali; mantenere eventuale render di cambio schermata |
| `15796`, `15917`, `15920`, `15929`, `15938`, `15951`, `16252`, `16293` | modal portal, salvataggi, progressioni, note | critico: aggiornare solo portal/riga e chiudere il portal senza ricostruire `#screen` |

## Cause prestazionali confermate dal codice

1. `renderCoachAfterFeedback()` mostra un feedback e poi chiama `render()` globale anche per anteprima, settimana e pannelli.
2. `openCoachModalLocally()` e il portal evitano gia parte del render, ma numerosi callback legacy chiamano ancora `render()` subito dopo.
3. `bindScreen()` esegue molti `querySelectorAll(...).forEach(addEventListener)` dopo ogni render globale. Questo ricrea listener e chiusure per tutto il Coach.
4. Alcune ricerche hanno debounce, ma il callback e ancora `render` (`librarySearchTimer`); la libreria esercizi quindi ricrea il modal invece di riconciliare solo la lista.
5. I campi inline sono gia la parte migliore: aggiornano il repository senza render e usano un commit ritardato. Il piano e estendere lo stesso modello a righe, gruppi, preview e modal.
6. Sono presenti timer di feedback, salvataggio, mascot e analisi; non risultano observer globali dedicati al Coach, ma i timer vanno centralizzati e cancellati alla chiusura del componente.

## Piano Fase 2, senza nuove funzioni

- introdurre patch DOM interne solo per componenti gia esistenti: editor header, giornata, riga, gruppo, preview, portal modal e risultati libreria;
- sostituire i `render()` critici elencati sopra con `renderCoachComponent(...)` locale e delegazione eventi stabile;
- montare una sola volta i listener del contenitore Coach e usare eventi delegati per righe/menu;
- mantenere `render()` soltanto per cambio pagina, cambio programma/scheda o stato che non puo essere aggiornato localmente;
- misurare sempre con `performance.now()` i sei percorsi richiesti prima e dopo.

Questo report non dichiara ancora la build completata: e la baseline necessaria prima delle sostituzioni.

## Fase 2 eseguita nella copia di lavoro

- `renderCoachAfterFeedback` ora aggiorna localmente il pannello Anteprima atleta/Coach AI quando l'editor e gia montato;
- la settimana continua ad aggiornare tab, campi, volume e testo del bot senza render globale;
- gruppi, riordino, copia, progressione e azioni della riga usano un aggiornamento del solo board quando possibile;
- il board locale usa delegazione eventi per non ricreare listener su ogni riga;
- apertura/chiusura modal gia in portal resta nel portal; salvataggio modal aggiorna il board locale;
- durante Coach non vengono piu eseguiti `renderEngine()` e `drawCharts()`, che appartengono alle altre schermate;
- ricerca libreria mantiene la riconciliazione in-place e il debounce.

## Audit prestazionale reale

Misure browser locale, in millisecondi, con la stessa macchina e gli stessi controlli Playwright. Il tempo include il round-trip del browser, quindi va letto come misura end-to-end e non come benchmark puro JavaScript.

| Azione | v144 baseline | rebuild dopo patch | Esito |
|---|---:|---:|---|
| Lista programmi -> editor | 4129 | 3913 | miglioramento misurato, da riconfermare su macchina reale |
| Anteprima atleta | 449 | 562 | risposta presente, ora aggiorna solo il pannello; numero influenzato dal round-trip |
| Cambio settimana | 417 | circa 473 | aggiornamento locale, nessun rebuild del board |
| Apertura menu aggiungi | 396 | circa 420 | menu nativo, nessun render globale |
| Apertura Aggiungi esercizio | 432 | circa 645 | portal locale, nessun rebuild di `#screen` |
| Modifica serie | non isolabile con affidabilita dal video | circa 212 | campo aggiornato senza render, focus preservato |

Le prove dopo patch hanno riportato zero errori JavaScript. La build non viene ancora dichiarata definitiva: serve una nuova registrazione reale dopo questa patch per confermare che il congelamento percepito sia sparito, oltre a una prova con dataset Firebase reale.
