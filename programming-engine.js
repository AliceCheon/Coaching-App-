# Piano di modularizzazione

La Fase 19 non riscrive l'app e non introduce framework. Mantiene il nucleo della Fase 18 in `index.html` e aggiunge due moduli isolati:

- `workout-pro.js`: modello della sessione attiva, persistenza, timer, flusso operativo e integrazione Logbook;
- `workout-pro.css`: layout immersivo, mobile, safe area, focus e responsive.

## Confini mantenuti

- Il repository principale, Firebase, backup, diagnostica e Safe Mode restano nel core.
- Workout Pro richiama le funzioni pubbliche già esistenti per contesto, storico, repository, rendering e cloud.
- I tick dei timer aggiornano solo nodi locali; input continui usano debounce; le azioni critiche salvano subito.
- La sync cloud avviene al salvataggio finale, non a ogni carattere o secondo.

## Passi futuri compatibili

1. Estrarre repository e migrazioni dal grande script inline senza cambiare API.
2. Estrarre Dashboard, Programmi, Logbook e Impostazioni in moduli nativi ES.
3. Aggiungere test di contratto per il repository e fixture versionate dei backup.
4. Aggiungere test browser reali su iOS Safari e Android Chrome per Wake Lock, voce e sospensione OS.

Ogni estrazione dovrà mantenere `index.html` come entry point, migrare in modo additivo e confrontare l'elenco delle funzioni prima/dopo.
