# Barbell Diva v144 · Coach rebuild

Questa cartella è la copia GitHub-ready della v144 finale con la rifinitura del Coach Studio.

## Regola di prodotto

Coach Studio è disponibile nella navigazione desktop. Non è stato aggiunto alla barra di navigazione del telefono, come richiesto da Alice. Nutrizione e Workout Pro restano fuori dall'app principale.

## Avvio locale

Aprire `Avvia-Barbell-Diva.cmd` oppure eseguire `Avvia-Barbell-Diva.ps1`. Per GitHub Pages è sufficiente pubblicare il contenuto della cartella come sito statico.

## Verifica

```text
node tests/v144-core.test.mjs
node tests/coach-v144-rebuild.test.mjs
```

Le prove browser hanno verificato caricamento dell'editor Coach e assenza di errori JavaScript; resta consigliata una prova finale su telefono reale per le schermate non-Coach e una prova Firebase con l'account reale.

GitHub Pages: questa build include `.nojekyll` e i report JSON sono codificati in UTF-8.
