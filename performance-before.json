# Dashboard alimentazione

Dashboard HTML generata dal file Excel `Dashboard alimentazione.xlsx`.

## Pubblicazione su GitHub Pages

Il file principale e' `index.html`.

Per pubblicarla:

1. Crea un nuovo repository su GitHub.
2. Carica `index.html` in quel repository.
3. Vai in `Settings` > `Pages`.
4. In `Build and deployment`, scegli `Deploy from a branch`.
5. Seleziona branch `main` e cartella `/root`.
6. Salva e aspetta che GitHub generi il link.

## Uso come app

La dashboard usa un tema scuro Athlete Lab / Cyber Nutrition e permette di
inserire dati nuovi da browser.

Le vecchie misurazioni presenti nell'Excel sono importate come storico iniziale
nell'app.

Sezioni principali:

- `Dashboard`: fase, target, macro, storico peso, roadmap nutrizionale.
- `Registro`: peso, kcal, macro, allenamento e note.
- `Ciclo`: calendario ciclo + dieta importato dall'Excel.
- `Circonferenze`: storico e nuove misurazioni corporee.
- `Pliche`: pliche, somma pliche, BF plicometro, LBM e FM.
- `Indicatori`: BMI, WHR, vita/altezza, composizione e riferimenti.
- `Foto`: foto progressi fronte/lato/retro salvate nel browser.
- `Backup`: esportazione JSON completa e CSV del registro peso.

La dashboard include anche un semaforo bulk basato sul target di aumento peso
settimanale impostabile nelle `Impostazioni attive`.

I dati inseriti vengono salvati nel browser del dispositivo con `localStorage`.
Questo significa che restano disponibili quando riapri la pagina dallo stesso
browser, ma non vengono sincronizzati automaticamente con Excel o GitHub.

## Aggiornamento dati Excel

I dati sono incorporati dentro `index.html` al momento della generazione.
Se il file Excel cambia, bisogna rigenerare questa pagina HTML.
