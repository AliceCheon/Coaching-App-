# Barbell Diva v144 — consolidamento Logbook

## Obiettivo

La build è stata consolidata sulla parte Logbook, Coach, sincronizzazione e protezione dati. Nutrizione e Workout Pro non fanno più parte del pacchetto applicativo.

## Modifiche

- rimossi `nutrizione/index.html`, `food-backup.js`, `photo-store.js`, `workout-pro.js` e `workout-pro.css`;
- rimossi gli asset Nutrizione/Workout Pro dal service worker;
- lasciata la compatibilità dei campi legacy nello schema/migrazione per non cancellare dati già presenti;
- build, manifest, query di cache e service worker uniformati a `v144`;
- introdotto `app-config-v144.js` per la configurazione condivisa della build;
- limite backup automatici portato a 5, con checksum, integrità, data, build, schema e gestione cronologia già verificabili;
- diagnostica ampliata con controllo rete, Firebase, cache, service worker, ultimo salvataggio, ultima sync, coda, backup e spazio;
- aggiunto il pulsante `Controllo completo`, che produce e copia un report;
- suite test riallineata alla struttura attuale con `tests/v144-core.test.mjs`;
- workflow GitHub aggiornato per eseguire il test v144 reale.

## Compatibilità e dati

Non viene modificato lo schema dati corrente senza passare dalle migrazioni. I campi legacy eventualmente già salvati non vengono cancellati: semplicemente non vengono più esposti come funzioni Nutrizione o Workout Pro.
