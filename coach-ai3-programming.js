# Changelog — Fase 19.1

Build: `v113-phase19.1` · schema dati: `5` invariato · cache PWA: `atlas-app-v113-phase19.1`.

- Sostituito il renderer condiviso con un dispatcher reale: `renderWorkoutMode`, `renderProMode`, `renderCompactMode`, `renderQuickMode` e `renderFreeMode`.
- Pro mostra una sola serie operativa alla volta.
- Compatta mostra tutte le serie dell'esercizio corrente, con input e completamento per riga e anteprima dei prossimi esercizi.
- Rapida mostra tutti gli esercizi e tutte le serie con i soli controlli essenziali.
- Libera permette sessioni anche vuote, ricerca/aggiunta/rimozione/riordino esercizi, aggiunta/rimozione serie e creazione di gruppi.
- Il passaggio Pro/Compatta/Rapida conserva lo stesso identificatore di sessione, i valori inseriti e i timer. La vista Libera è consentita soltanto per una sessione nata in modalità Libera.
- Diva Bot usa avatar, stato, personalità e reazioni già esistenti, ma viene montata in un livello overlay separato durante Workout Pro.
- Aggiunti trascinamento e posizione persistente del bot, limiti allo schermo e adattamento a tastiera e pannelli inferiori.
- Impedito il salto del bot durante il completamento o il ridisegno di una serie.
- Aggiornati HTML, JavaScript, CSS, manifest e service worker alla build v113.
- Aggiunta una suite DOM comportamentale eseguibile nel browser per viewport mobile e desktop.

Nessuna migrazione aggiuntiva: backup v4 e dati schema 5 restano compatibili.
