# Changelog v144 Coach rebuild

## Correzioni incluse

- rimossa la voce Coach dalla navigazione mobile; il Coach resta desktop-only;
- mantenuto l'editor compatto a giornate richiudibili con anteprima atleta laterale;
- preservato il salvataggio inline debounced, senza ridisegnare la pagina a ogni carattere;
- centralizzato il perimetro del filtro muscolare includendo primari, secondari, stabilizzatori, regione target, priorità e alias;
- aggiunta gestione esplicita della rimozione della progressione dalla riga esercizio;
- reso il menu azioni più sicuro in altezza e con rispetto della modalità movimento ridotto;
- mantenuta la separazione tra moduli legacy e app principale, senza reintrodurre Nutrizione o Workout Pro;
- aggiunti test statici dedicati e documentazione di consegna GitHub.

## Limiti dichiarati

Non ho dichiarato verificata la sincronizzazione Firebase tra due dispositivi reali: il browser locale ha verificato il percorso UI e l'assenza di errori, ma serve ancora il test con account/rete reali.
