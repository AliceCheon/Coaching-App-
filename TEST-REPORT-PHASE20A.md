# Report test — Barbell Diva v115 Fase 20A

Data: 20/07/2026

## Esito

- 123/123 test automatizzati selezionati superati.
- 75 test unitari input/output del motore superati (requisito minimo: 45).
- 20 test di integrazione Fase 20A superati.
- 18 test Workout Pro/Fase 19.2 superati.
- Regressioni mirate Fase 16–19, repository programmi, alias storico, consolidamento settimane, accessibilità tab, nutrizione e correzioni dashboard superate.
- JavaScript inline, `workout-pro.js`, `programming-engine.js` e service worker validi.
- Browser reale: modulo `v115-phase20a` caricato e runtime `ready` verificato via HTTP.
- Mobile Pro 390 × 844: layout compatto già verificato sul medesimo CSS, nessun overflow orizzontale, controlli principali e dock entro la schermata, spostamento Diva Bot alla spunta 0 px.

## Scenari coperti

- nessuno storico, una seduta, due sedute, storico sufficiente;
- crescita stabile e occasionale, mantenimento, variabilità normale;
- regressione singola e ripetuta, plateau possibile/probabile;
- dolore, readiness bassa, seduta incompleta, fatica locale/sistemica;
- warm-up, top set, back-off, drop set, set saltati e dati legacy;
- comparabilità, aderenza, confidenza, evidenze, anomalie e serializzazione;
- tutte le 15 progressioni supportate e `custom` non supportata;
- cache, invalidazione, refresh, simulazione e decisioni non mutanti;
- migrazione schema 5, backup/ripristino e invalidazione dopo salvataggi.

## Correzioni nate dai test

- Readiness 0–10 interpretata correttamente, senza confonderla con una scala 0–100.
- `null`, `undefined` e stringhe vuote non sono trasformati in zero.
- Un mismatch di attrezzatura riduce davvero la comparabilità.
- Crescita stabile richiede incrementi ripetuti, non un solo picco.
- RIR e carichi impossibili vengono marcati come anomalie.

## Limiti verificabili solo sul dispositivo/account di Alice

- Firebase reale e recupero dello storico cloud dopo login.
- Wake Lock, microfono, notifiche e relativi permessi del telefono.
- Comportamento PWA dopo installazione/aggiornamento sul browser mobile specifico.

Questi punti non sono dichiarati superati senza una prova sul dispositivo reale.
