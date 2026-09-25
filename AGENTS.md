# AGENTS.md — Coaching-App (Alice / Barbell Diva)

## Cosa è
App web statica (HTML + JS vanilla, nessun bundler) per la programmazione di
allenamento. Il cuore logico è `src/app-main.js` (file molto grande): contiene
stato, modelli, UI e la logica di derivazione della Fase.

## Comandi
- Test: `node --test tests/*.test.mjs`
- Test singolo: `node --test tests/<file>.test.mjs`
- Sintassi: `node --check src/app-main.js`
- Preview statico: `python3 -m http.server 12000 --bind 0.0.0.0`

## Harness dei test
I test caricano `src/app-main.js` in una VM Node con stub di `window`/`document`
e un prologo per `matchMedia`, `setInterval`, `performance`, `history`. Vedi
`tests/v14753-motore-fasi-inferenza.test.mjs` come modello pulito.

## Verifica layout su viewport piccoli (FlexWindow / cover screen)
Chromium headless ignora `--window-size` sotto ~500px di larghezza, quindi per
misurare davvero 400x365 si usa una pagina con `<iframe width=400 height=365>`
e si legge `contentDocument.title` (misure) via `--dump-dom`. Vedi
`tests/v14757-canvas-not-white.test.mjs` (motore di cascata CSS in Node).

**Trappola nota**: elementi "fantasma" fuori dai `<media>` di `min-width:981px`
restano in flusso su mobile e allungano il documento oltre `100dvh`
(`.coach-editor-nav-restore`, `#globalDivaBotHost` reso `position:static` da
`coach-studio.css`). Bastano pochi px per far scivolare la scena sotto la piega.

## Fonte unica di versione
1. `app-config-v144.js` → `build: "v147.X-suffisso"` e `cache: "atlas-app-v147X-suffisso"`.
2. Allinea i `?v=v147X` in `index.html`, `manifest.webmanifest` e `CACHE_NAME` in `service-worker.js`.
3. Il token deriva da `vMAJOR.MINOR` → `vMAJOR+MINOR` (es. `v147.57` → `v14757`).
4. `tests/version-single-source.test.mjs` e molti altri test hardcodano build/cache: aggiornali tutti con un `sed` globale.

## Fase dell'allenamento — architettura (v147.55)
Motore a 3 strati in `src/app-main.js`:
- **Strato A** `phaseWeekSignals(program)`: estrae segnali per settimana dalle
  prescrizioni reali (serie, forma delle reps, test, RIR, tempo).
- **Strato B** `phaseWeekScores(...)`: assegna punteggi per fase con evidenze
  pesate, in modo **relativo al blocco** (volume vs massimo, posizione nel blocco).
- **Strato C** `classifyProgramWeeks(program)`: sceglie la fase, calcola la
  confidenza ed espone `evidence`/`signals`/`requiredSignal`/`blockPhase`.

### Due livelli distinti (non confonderli)
- **Fase/obiettivo del BLOCCO** (`phaseBlockMethodology`): la metodologia
  dominante dell'intero blocco, dedotta dalla forma di prescrizione ricorrente.
  `"12-8"` discendente ricorrente → `intensità`; range ascendente `"8-12"` → `accumulo`.
  Esposta come `blockPhase` (non come `phase`).
- **Tipo della SETTIMANA** (`phase`): deciso **relativamente alle altre settimane**,
  con questa scala:
  1. test dominanti a fine blocco → `peaking`;
  2. calo di volume rispetto alla mediana del blocco (`volumeDrop >= 0.15` o
     `setsDrop >= 0.15`, con `volumeRatio <= 0.72`) → `deload`;
  3. test dominanti a inizio blocco → `tecnica`;
  4. altrimenti settimana di lavoro → `blockPhase` (o segnali locali se il blocco
     non ha metodologia riconoscibile).

**Regola d'oro**: un segnale stabile nel blocco (es. `"12-8"` in tutte le settimane)
NON può provare il tipo di una singola settimana. Un calo di volume è uno scarico
anche dentro un blocco di intensità. Mai far vincere la fase del blocco sul tipo
della settimana, né viceversa.

Gerarchia in `phaseFromProgramData`:
1. override esplicito `program.periodization.weeks` → `source: "explicit"`;
2. motore → `source: "inferred"`, `estimated: true`;
3. etichetta canonica del blocco o del programma (ultima spiaggia).

## Distinzione fondante (non regredire)
- **Segnale intra-settimana**: forma della prescrizione dentro la seduta.
  `"12-8"` = discendente nella serie → tecnica di **intensità/intensificazione**.
- **Segnale inter-settimana**: variazione fra settimane (es. 15 → 12 → 10).
Confonderli fa leggere `"12-8"` come calo di volume, producendo deload/volume
errati. Verificato sui dati reali: `Intensità Agosto-Ottobre` ha rapporto
`descPairRatio` 0.50-0.60 (dominante `12-8`), `Intensificazione` 0.00 (solo
range ascendenti `15-20`).

## Vincoli di prodotto
- La Fase **non** dipende dal nome del programma né da una tabella seminata.
  La v147.52 scriveva una mappa per nome: `migrateRemoveSeededWeekPlans` la
  rimuove (solo se identica ai semi originali) per non sovrascrivere override
  scritti a mano.
- La Fase **non** è determinata dal `type` del singolo esercizio (`sheetWeekType`
  rimosso).
- `periodization.weeks` resta un **override opzionale** dell'autore.
- Le fasi che i dati non bastano a dedurre (forza, tecnica, mantenimento,
  ricondizionamento, specializzazione) restano a bassa confidenza e dichiarano
  il segnale mancante via `requiredSignal` invece di inventare una fase.

## FlexWindow (schermo esterno Galaxy Z Flip) — v147.57
- Il FlexWindow è 948×1048 px fisici ≈ **400×365 CSS px** (entra in
  `max-height:430px` + `max-width:560px`), quindi il tema di default è quello
  scuro: la barra in basso è scura, non chiara.
- **La banda bianca in fondo non era più un overflow** (a 400×365 il documento
  riempie il viewport). Era l'**area non dipinta sotto il documento**: `html` e
  `body` avevano sfondo trasparente (solo gradienti con bordi trasparenti), e il
  canvas radice del browser è **bianco** di default.
- Fix (v147.57): `html` dipinge lo sfondo del tema (`html` scuro di default,
  `html[data-theme="light"]` lavender), con `background-attachment: fixed`, e
  `render`/`syncThemeUi` rispecchiano `data-theme` su `documentElement`. Uno
  script inline in `<head>` imposta il tema su `<html>` **prima del primo
  paint** leggendo `alice-method-app.v8`.
- Test: `tests/v14757-canvas-not-white.test.mjs` (fallisce se lo sfondo su
  `html` o la sincronizzazione di `data-theme` spariscono).

## FlexWindow — edge-to-edge del canvas (v147.59)
- La v147.57 dipingeva su `html` una **background-image** ma il
  **background-color** restava trasparente. Con `viewport-fit=cover` il browser
  estende al bordo fisico **solo il colore** del root: il gradiente resta dentro
  il layout viewport, che sul cover screen e' **piu' basso dello schermo fisico**
  (100dvh esclude la system navigation). L'area sotto tornava quindi al canvas
  BIANCO, generando la fascia chiara.
- In piu' `body { padding-bottom: env(safe-area-inset-bottom) }` sommava l'inset
  all'altezza del documento, che superava il layout viewport (misurato col CDP a
  400x365 + inset 32px: **397px su 365px**), allargando la fascia scoperta.
- Fix (v147.59): `background-color` opaco su `html` (e su `html[data-theme=light]`),
  dichiarato **dopo** la shorthand `background`; rimosso il `padding-bottom` dal
  `body` (il fondo schermo e' gia' gestito da `.screen` e `.bottom-nav`).
- Test: `tests/v14759-flexwindow-edge-to-edge.test.mjs`.
- Verifica col CDP (Chromium headless + `Emulation.setSafeAreaInsetsOverride`):
  `html` deve riportare `background-color: rgb(8,7,25)` e il documento non deve
  superare il layout viewport. Dopo il fix, a 300px di layout viewport su 365px
  di schermo, la fascia sotto e' del colore del tema, non bianca.
