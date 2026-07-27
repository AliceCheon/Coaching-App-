# Test report — Barbell Diva v112

Data: 20/07/2026. Ambiente browser: viewport mobile 390×844, server HTTP locale. Nessuna scrittura è stata inviata a Firebase reale.

## Test realmente eseguiti e superati

- Avvio Workout Pro da Allenamento e inserimento carico/ripetizioni/RIR.
- Completamento serie, timer automatico e volume/progresso live.
- Ricaricamento pagina con sessione attiva; rilevato “Allenamento in corso trovato”.
- Ripresa sessione con timer ricalcolato dal timestamp, senza reset.
- Review finale, salvataggio locale definitivo e riapertura nel Logbook.
- Assenza di errore di salvataggio nell'origine di test.
- Impostazioni centralizzate verificate con stato locale autenticato simulato dalla fixture esistente.
- Mobile 390×844, safe area e pulsanti minimi.
- Bug Diva Bot: posizione prima/dopo spunta identica (`delta x=0`, `delta y=0`).
- Sintassi di `workout-pro.js` e `service-worker.js` valida.
- Suite Fase 19: 11/11 pass.
- Regressione storica: 41 pass, 10 fail preesistenti; baseline Fase 18: 30 pass, gli stessi 10 fail. Nessun nuovo test storico fallito.
- Confronto funzioni: 490 funzioni baseline, 496 in v112, 0 rimosse.

I dieci test storici già rossi nella baseline includono aspettative di vecchi numeri cache/build e un fixture del volume Dashboard; non sono stati mascherati né dichiarati passati.

## Matrice richiesta

Legenda: **B** browser eseguito; **A** test automatico/strutturale eseguito; **N** non eseguibile in modo reale nell'ambiente disponibile.

1–5 avvio normale/Pro, completa/modifica/copia serie: B/A. 6 warm-up: A. 7 recupero automatico: B. 8 recupero manuale: A. 9–10 sospensione/ritorno: B tramite reload e timestamp, non sospensione OS reale. 11 timer esercizio: A. 12–14 superset/triset/circuito: A. 15–17 drop set/rest-pause/AMRAP: A. 18 aggiunta serie: A. 19 eliminazione serie: N, sostituita da salto + undo nella UI corrente. 20 undo: A. 21 sostituzione temporanea: A. 22 definitiva: A, conferma separata; nessuna modifica reale fatta nel test. 23 riordino: A. 24 esercizio saltato: A. 25 pausa: A/B. 26 chiusura browser: B tramite reload, non chiusura processo OS. 27 ripristino: B. 28 Wake Lock reale: N. 29 browser senza Wake Lock: A. 30 voce supportata: N. 31 voce non supportata: A. 32 suggerimento carico: A. 33 dati insufficienti: A. 34 PR: A. 35 completamento: B. 36 modifica riepilogo: A. 37 salvataggio locale: B. 38 errore cloud reale: N; ramo offline verificato A. 39 riapertura Logbook: B. 40 backup/ripristino sessione: A; import backup v4 verificato. 41 mobile piccolo: B 390×844. 42 tablet: N. 43 desktop: B in controllo di caricamento. 44–45 tema chiaro/scuro: A. 46–48 animazioni complete/ridotte/off: A. 49 Safe Mode: A, nessuna distruzione dati. 50 regressione completa: eseguita, nessuna nuova regressione rispetto alla baseline.

## Limiti noti

- Wake Lock, notifiche, microfono, sospensione iOS/Android e Firebase reale richiedono test su dispositivi/browser con permessi e account dell'utente.
- La cancellazione fisica di una singola serie non è esposta: si usa “Salta serie” e si può annullare. La serie resta auditabile.
- Le quattro modalità condividono lo stesso modello e differiscono nel flusso di ingresso; non sono quattro motori separati.
- Il riconoscimento PR iniziale copre carico e prima esecuzione; gli altri criteri restano conservabili nello schema ma richiedono più storico omogeneo.

## Conferme

- Nessun framework aggiunto.
- Nessuna funzione Fase 18 rimossa.
- Backup v4 importabili tramite migrazione v5.
- Nessuna sessione definitiva viene creata prima della conferma finale.
- Nessun dato esistente viene cancellato dalla migrazione; la sola correzione mirata richiesta riguarda la data della Scheda F.
