# Report test v144

## Esito automatico

- `tests/v144-core.test.mjs`: PASS — 17 controlli;
- sintassi JavaScript: PASS — 12 moduli esterni + script inline;
- riferimenti ai file rimossi: PASS;
- build/cache/manifest: PASS — identificativo `v144`;
- suite storica non coerente: sostituita, perché puntava a `atlas-coach-app.html`, file non presente nella struttura attuale.

## Esito manuale via HTTP locale

- apertura di `index.html`: PASS;
- caricamento dashboard e programmi: PASS;
- navigazione Coach Studio e programmi: PASS;
- apertura Diagnostica: PASS;
- presenza di `Controllo completo`: PASS;
- esecuzione controllo completo e messaggio report copiato: PASS;
- errori console durante le prove: 0.

## Limiti dichiarati

Non è stato possibile provare una sincronizzazione Firebase reale tra PC e telefono con un account personale, né un refresh simultaneo durante una connessione mobile reale. La suite verifica il contratto locale, la coda e i punti di integrazione; la prova end-to-end reale resta da fare dopo la pubblicazione/autenticazione.
