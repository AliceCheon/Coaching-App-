# Report test v144 Coach rebuild

## Automatici

- `tests/v144-core.test.mjs`: PASS, 17 controlli.
- `tests/coach-v144-rebuild.test.mjs`: PASS, 12 controlli.

I controlli coprono navigazione mobile senza Coach, editor/anteprima laterale, salvataggio inline debounced, menu azioni, progressioni, filtro muscolare, reduced motion e assenza dei moduli standalone rimossi.

## Browser locale

- apertura app: PASS;
- apertura Coach Studio/editor programma: PASS;
- zero errori JavaScript nella console: PASS;
- presenza editor settimanale e pannello anteprima: PASS.

## Da provare prima del rilascio pubblico

- sincronizzazione Firebase PC ↔ telefono con due sessioni reali;
- chiusura/riapertura completa dopo modifica di un campo inline;
- installazione PWA su Android/iOS;
- test di backup e ripristino con dati reali.
