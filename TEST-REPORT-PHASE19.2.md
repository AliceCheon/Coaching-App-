# Test report — Barbell Diva v114 Fase 19.2

Data: 20/07/2026. Schema dati: 5 invariato.

## Risultati

- Sintassi JavaScript e service worker: superata.
- Suite Node: **18/18 test superati**.
- Suite DOM mobile: **17/17 controlli superati**.
- Prova sul Logbook reale del browser: 37 sedute prima dei test e 37 dopo ricaricamento.
- Scheda F recuperata dal journal visualizzata al 16 luglio dopo il caricamento asincrono.
- Esportazione con cronologia locale piena: download avviato e messaggio esplicito sulla mancata seconda copia interna.
- Parser dei due script PowerShell di avvio/server: 0 errori.
- Backup legacy fornito: JSON valido, schema 4, 36 sedute, 4 Schede F storiche; nessuna Scheda F del 16/07/2026.

## Limite importante

La Scheda F recente presente nell'archivio PC contiene soltanto un esercizio e una serie, quindi non è stata dichiarata come allenamento completo di Alice. Nessun carico o esercizio mancante è stato inventato. Serve il backup esportato dal telefono o da un altro dispositivo che mostri la seduta completa.

## Protezione verificata nel codice

- Import e ripristino Logbook solo-additivi.
- Journal locale e IndexedDB mantenuti.
- Test senza scritture nello stato reale.
- Download del backup indipendente dallo spazio riservato alla cronologia interna.
- Avvio su origine HTTP stabile per riutilizzare lo stesso archivio del browser dopo gli aggiornamenti.
