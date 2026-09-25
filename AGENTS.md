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

## FlexWindow — display cutout e due livelli (v147.60)
Il bug vero non era il colore: la PWA veniva **confinata nell'area sopra il foro
fotocamere** e non usava tutta la superficie fisica. Leva trovata nel manifest:
`"orientation": "portrait"` segnala un'app a orientamento/aspect **fisso**, che
One UI sul cover screen (finestra ~400x365, landscape) letterboxa nell'area
"sicura" sopra le fotocamere. Da li' la scena in alto e la versione "piu'
piccola" quando si cambia formato col tasto Samsung.

- **Non confondere i due livelli**:
  1. **LAYOUT/CANVAS** edge-to-edge su tutta la superficie, anche dietro/attorno
     al cutout. Leve: manifest **senza** `orientation` forzato +
     `display_override: ["standalone","fullscreen"]`; `viewport-fit=cover`;
     `background-color` opaco del root (v14759). Il canvas non deve avere inset.
  2. **UI INTERATTIVA** (header, tab, card, bottom-nav) dentro la safe area:
     inset del cutout applicati **solo** agli elementi di interfaccia.
- `index.html` non forzava `orientation` via JS: nessuna modifica necessaria.
- Fix (v147.60): rimosso `"orientation": "portrait"` dal manifest; aggiunti
  `.app-header`/`.phone-status`/`.top-tabs` con `env(safe-area-inset-top)` e
  `.bottom-nav` con gli inset laterali/basso, in `@media (max-height: 520px)`.
- **Verifica in landscape** (fondamentale, perche' senza l'orientamento fisso il
  display interno puo' ruotare): a 915x412 e 844x390 il layout non ha overflow
  (`.phone` riempie `100dvh`, `scrollWidth == clientWidth`).
- Test: `tests/v14760-flexwindow-cutout-edge-to-edge.test.mjs`.
- CDP con cutout in alto (28px) + gesture bar (20px) a 400x365: header a 32px
  (4+28), nav a 25px (5+20); telefono aperto e desktop invariati.

## FlexWindow — canvas senza `background-attachment: fixed` (v147.61)
Sul dispositivo la banda chiara **restava** e, in modalita' "schermo intero"
Samsung, copriva **anche la bottom nav**. Ricerca autorevole (Chrome/Android
edge-to-edge, layoutInDisplayCutoutMode, WebView insets, segnalazioni One UI 8):

- L'estensione della finestra dietro/attorno al cutout e' decisa dal **container
  Android / One UI**, non dal CSS: `viewport-fit=cover` ed `env(safe-area-inset-*)`
  dispongono solo dentro la superficie che il sistema espone. Una PWA con
  `display: standalone/fullscreen` puo' non ricevere la modalita' cutout che
  invece ottiene `requestFullscreen()`, e One UI puo' letterboxare in base
  all'aspect/aspect-override per-app.
- E' inoltre **bug noto di Chrome su One UI 8**: barra vuota in fondo su *tutti*
  i siti (Chrome 140+); workaround segnalato: `chrome://flags` →
  `EdgeToEdgeEverywhere` disabilitato. Non dipende dal sito.
- `background-attachment: fixed` e' **inaffidabile** su Chrome/Android: non
  ridipinge l'area scoperta quando il viewport cambia (es. al toggle di
  modalita'), lasciandola bianca.

Fix (v147.61), hardening indipendente dal container:
- rimuovere `background-attachment: fixed` dal canvas (`html`);
- `html { height: 100% }` + `background-color` opaco del tema, cosi' il canvas
  copre l'intera finestra e il colore arriva fino ai bordi.
- Verificato: FlexWindow 365/365, Z Flip aperto 915/915, desktop invariato.
- Test: `tests/v14760-flexwindow-cutout-edge-to-edge.test.mjs` (esteso) e
  `tests/v14757-canvas-not-white.test.mjs` (aggiornato al nuovo meccanismo).

**Limite noto**: se One UI/Chrome dipingono la banda o confinano la finestra,
non e' superabile dal solo web. Mitigazioni lato utente: Chrome aggiornato,
flag `EdgeToEdgeEverywhere`, GoodLock/MultiStar per l'aspect del cover screen.

## FlexWindow — edge-to-edge via `requestFullscreen()`, NIENTE TWA (v147.62)
Il limite precedente e' superabile **senza** TWA. Un bug report Chromium
documentato (`chromium-pwa-cutout-bug`) mostra la differenza:

| Metodo | Renderizza dietro il cutout? |
| --- | --- |
| `requestFullscreen()` su primo gesto utente | **si** |
| `display: "fullscreen"` nel manifest | no (fascia bianca/nera) |

Causa: `requestFullscreen()` imposta sull'Activity Android
`LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` (superficie del cutout sbloccata),
mentre il manifest `fullscreen` resta sul cutout mode DEFAULT/NEVER. Stesso
problema nei TWA generati con Bubblewrap senza `shortEdges` (issue #1035).

Fix (v147.62), tutto web, nessun packaging Android:
- **rimosso `"fullscreen"` da `display_override`** (resta `display: standalone`):
  e' proprio il fullscreen del manifest a causare la fascia;
- `index.html` chiede `documentElement.requestFullscreen()` **al primo gesto
  utente** (`pointerdown`/`keydown`, `{ once: true }`, `catch` silenzioso, guardia
  su `requestFullscreen`). Se il browser rifiuta, l'app resta come prima.
- Il canvas (fuori dalla safe area) arriva ai bordi fisici, dietro il cutout;
  l'UI resta dentro `env(safe-area-inset-*)`.
- Test: `tests/v14762-flexwindow-request-fullscreen.test.mjs`; aggiornato
  `tests/v14760-flexwindow-cutout-edge-to-edge.test.mjs` (niente fullscreen nel
  manifest). Suite 151/151. Boot smoke: nessun errore, layout intatto.

**Perche' non complica la repo**: nessun progetto Android, nessuna build, nessun
APK. Restano i soli file web gia' deployati da GitHub Pages; le modifiche
future si fanno come sempre su `main`.
