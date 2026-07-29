# Barbell Diva v145 — GitHub Safe

Build derivata dalla v144 stabile e verificata prima della pubblicazione.

## Cosa conserva

- menu Coach Studio essenziale;
- Anteprima atleta laterale con chiusura locale veloce;
- Statistiche in finestra grande con muscoli selezionabili;
- una sola Diva Bot;
- sincronizzazione affidabile Firebase già presente;
- compatibilità con i dati e i backup della v144.

## Cosa è stato escluso

- auto-sync verso `/api/coach/state`, incompatibile con GitHub Pages;
- sezioni laterali non richieste;
- observer e animazioni globali che potevano rallentare l'editor;
- cache di sviluppo e file temporanei.

## Pubblicazione

Caricare nella radice del repository il contenuto di questa cartella, mantenendo
anche i file `.nojekyll` e `_config.yml`.

La cartella `tests` include anche `v145-release-guard.test.mjs`, che impedisce
di reintrodurre menu indesiderati, statistiche non interattive, chiusura lenta
dell'Anteprima atleta o sincronizzazioni incompatibili con GitHub Pages.
