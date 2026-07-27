# Test report — Barbell Diva v113 Fase 19.1

Data: 20/07/2026. Build: `v113-phase19.1`. Schema dati: `5`. Cache: `atlas-app-v113-phase19.1`.

## Risultati automatici

- Controllo sintassi JavaScript: superato.
- Suite Node strutturale e di compatibilità: **14/14 test superati**.
- Confronto dichiarazioni nominate con il backup v112: **0 funzioni mancanti**, 21 aggiunte.
- Versione HTML, manifest e service worker coerente con la build v113.
- Data della Scheda F ancora corretta al 16/07/2026.

## Test DOM comportamentali nel browser

Suite `tests/phase19-1-dom-behavior.html`, caricata tramite server HTTP locale.

- Viewport mobile 390×844: **17/17 controlli superati**.
- Viewport desktop 1280×900, superficie app 1200 px: **17/17 controlli superati**.
- Pro: una sola serie operativa renderizzata.
- Cambio Pro → Compatta: stesso ID sessione e valore `42.5` conservato.
- Compatta: tutte le serie dell'esercizio corrente presenti.
- Rapida: tutti gli esercizi presenti.
- Sessione programmata: passaggio incompatibile a Libera bloccato.
- Libera: aggiunta/rimozione serie aggiorna il modello; sessione svuotabile.
- Diva Bot: riuso del bot esistente, nessun duplicato, trascinamento funzionante.
- Diva Bot dopo ridisegno della serie: spostamento inferiore a 1 px, quindi nessun salto.
- Nessun overflow orizzontale dell'app nelle due superfici testate.

## Compatibilità dati e funzioni

- Schema 5 mantenuto; nessuna nuova migrazione necessaria.
- Sessione, valori inseriti e timer non vengono ricreati al cambio tra Pro, Compatta e Rapida.
- Percorsi di backup, ripristino, account, sincronizzazione e Logbook non sono stati rimossi.
- Il renderer Libera può produrre una sessione vuota solo dopo conferma esplicita.

## Limiti dichiarati

Non sono stati simulati né dichiarati superati i test che richiedono un dispositivo fisico o credenziali/permessi dell'utente: Firebase reale, Wake Lock reale, microfono, tastiera mobile del sistema, sospensione iOS/Android e sincronizzazione tra due dispositivi. Questi controlli restano da eseguire sul telefono e sul PC di Alice.

## Backup pre-intervento

- Archivio: `Backup-Barbell-Diva-v112-pre-Fase19.1.zip`.
- Contenuto: 77 file.
- SHA-256 archivio: `2A0EE7338B46951D3B7B64612A1C96C1073C7575387062F796C27221DFC5731D`.
- SHA-256 dell'`index.html` originale, identico tra sorgente e copia: `6D11E2FF33FFB5D61AFF74F3045AC9A934BA98DD5EAE4DF07F0D4D0EADBC8E34`.
