# Active Context — Coaching-App

Ultimo aggiornamento: 2026-10-07 — build `v147.94-animazioni` (FASE 3-bis).

Use this section as the short "global context" that survives across parallel chats and task handoffs.

## Project snapshot

- **Che cos'è**: "Barbell Diva" — PWA di coaching fitness di Alice (programmazione,
  allenamento, analisi performance). Repo `AliceCheon/Coaching-App-`.
- **Stack**: PWA statica HTML + JS vanilla, **nessun bundler a runtime** (Vite solo via
  script npm). Il cuore logico è il monolite `src/app-main.js` (~15.750 righe):
  stato, modelli, UI, motore Fasi e motore Progressioni.
- **Deploy**: GitHub Pages da `main` (https://alicecheon.github.io/Coaching-App-/).
  In più un wrapper Android (TWA) in `android-twa/`.
- **Versionamento a sorgente unica**: `app-config-v144.js` (`build` + `cache`);
  token = `vMAJOR+MINOR` (v147.92 → `v14792`) rimirrorato in `index.html`,
  `manifest.webmanifest`, `service-worker.js`, `FIREBASE-LOGIN.md` e ~19 test.
  Bump: `node tools/bump-version.mjs v147.XX-suffisso` (aggiorna ~27 file).

## Le 4 fasi richieste da Alice (piano originale)

1. ✅ **FASE 1 — Diario di seduta** (PR #7, merged).
2. ✅ **FASE 2 — UI polish** (PR #8, merged; temi chiaro/scuro esistenti mantenuti).
3. ✅ **FASE 3 — Animazioni + mascotte (Diva Bot)** → build `v147.93-animazioni`.
   - ✅ **FASE 3-bis — Animazioni più evidenti (non invasive)** → build `v147.94-animazioni`.
4. ⏳ **FASE 4 — Statistiche** ← PROSSIMA.
5. ⏳ **FASE 5 — Coach AI**.

## Current state

- **Build**: `v147.94-animazioni` (FASE 3-bis).
- **Ultimo commit FASE 3-bis**: build `v147.94-animazioni` (branch `genspark_ai_developer`).
  Base precedente: `a3dcb39` (Merge PR #15, FASE 3 `v147.93-animazioni`).
- **Suite test**: da riconfermare a fine FASE 3-bis (~8 min di durata →
  lanciare in background). Comando: `node --test tests/*.test.mjs`.
- **Tree**: `main` = `origin/main`; branch di lavoro `genspark_ai_developer`.

## Ultima sessione in sintesi (2026-10-07)

- **Progressioni "Intensità:" riparate**: i 3 metodi (test 12rm + ondata, test 10rm +
  salita 6→9, test a metà ciclo) producevano il default **8-12**. Causa: parametri
  vuoti `{}` (la sequenza viveva solo nella descrizione). Fix: `parameters.pattern`
  (`["3:10-x","2:10",...]`) applicato come **ultima parola** in
  `generateProgressionWeeks` (dopo la regola `linear-reps` che sovrascriveva la W1).
  Metodo 1 allineato alle **ultime schede** del foglio (`Lat_mono`/`Front_squat`):
  W2 `10-x`, W3 `10-8-x`, W4 `10`, W5 `10-x`, W6 `10-8-x`, W7 `10-8-x`, W8 `10`.
- **Editor progressioni settimana-per-settimana**: nuova tabella in
  `progressionTemplateEditorHtml` (`data-progression-pattern`), salvata in
  `parameters.pattern`. Vale su qualsiasi esercizio.
- **Metodi personali**: `progressionTemplates()` ora include i template creati da
  zero (`!baseTemplateId && non-predefinito`), prima venivano scartati.
- **RIR/RPE vuoti ovunque** dalle schede (autoregolati a mano in allenamento).
- **Fix**: rimosso un errore di sintassi a fine `src/app-main.js` che bloccava tutto.

## FASE 3 in sintesi (2026-10-07) — build `v147.93-animazioni`

Perimetro concordato: **mascotte Diva Bot + motion UI generale**, tutto dentro
`src/app-main.js` + `coach-studio-inline.css`, sempre rispettando i modi
`full`/`reduced`/`off` e `prefers-reduced-motion`.

- **3.1 — Transizioni di schermata**: `.screen.screen-enter` già esistente,
  ora scatta solo sul **cambio reale**. Aggiunta la transizione di **route** del
  Coach Studio (`.coach-studio-page.route-enter` + `@keyframes premiumRouteIn`)
  e l'**ingresso animato dei modali** (`@keyframes coachModalIn` + backdrop
  `premiumFadeIn`). In `render()` una nuova `renderKey` (schermo + route coach)
  evita che le transizioni ripartano ad ogni render interno.
- **3.2 — Micro-animazioni UI**: hover-lift su card/kpi/shortcut/`exercise-lab-card`
  (solo `@media (hover:hover) and (pointer:fine)`), "pop" del tab attivo al cambio
  schermata (`@keyframes navPop`). Il feedback di completamento serie
  (`.compact-set-done.done` → `premiumCheck`) era già presente.
- **3.3 — Mascotte evoluta**: due nuovi eventi
  `program_saved` e `backup_exported` in `DIVA_BOT_EVENTS` + messaggi in
  `DIVA_BOT_MESSAGES` + agganci in `handleProgramAction("save")` e
  `exportBackup()`. Prima quelle azioni erano mute.
- **3.4 — Guardie**: `tests/v14793-animazioni.test.mjs` (transizioni, modali,
  micro-animazioni, nuove reazioni, degradazione reduced/off, `#globalDivaBotHost`
  fuori flusso).

## FASE 3-bis in sintesi (2026-10-07) — build `v147.94-animazioni`

Alice: *"Non noto molto cambiamenti"* → le animazioni della FASE 3 erano troppo
sottili (9-14px, 140-260ms) e, soprattutto, il **vecchio service worker serviva
ancora la v14793 in cache**. FASE 3-bis rende il motion **più evidente ma non
invasivo**, sempre dietro i gateway `premiumMotionEnabled()`/`effectiveAnimationMode()`.

- **Transizioni più marcate**: `premiumScreenIn` 9px→**16px + scale(.994)**;
  `premiumRouteIn` 10px→**18px**; `coachModalIn` 14px/.982→**22px/.955**.
- **Entrata a cascata** della sezione route: `.coach-studio-page.route-enter > *`
  (`@keyframes premiumStagger`, 340ms) con delay scaglionati `.02/.06/.10/.14/.18/.22s`.
  Parte **solo** sul cambio reale di route (via `renderKey`), non ad ogni render.
- **"Pop" della mascotte** ad ogni reazione: `.coach-avatar.mascot-pop`
  (`@keyframes mascotPop`, 0→1.14→.98→1 con leggera rotazione) innescato da
  `popCoachMascot()` dentro `setCoachMascotState()`, così si nota anche quando
  lo stato resta lo stesso. Timer tracciato in `coachMascotController.popTimer`.
- **Degradazioni**: in `reduced` lo stagger → `premiumFadeIn` e il pop → `animation:none`;
  in `off` tutto a `.01ms`. Nessuna animazione obbligatoria.
- **Guardie**: `tests/v14793-animazioni.test.mjs` esteso con i blocchi "3-bis — entrata
  a cascata" e "3-bis — 'pop' della mascotte" (8 test, ora verdi).
- **Bump**: `node tools/bump-version.mjs v147.94-animazioni` (29 file) — così il
  `CACHE_NAME` del service worker cambia e il PWA scarica subito la versione nuova.

## Prossimi step consigliati

1. **FASE 4 — Statistiche** (dopo merge della FASE 3-bis).
2. (Poi) FASE 5 — Coach AI.
3. Se Alice vuole, estendere la FASE 3 con transizioni dedicate a tab interni di
   Allenamento (richiede un tracker di tab per evitare il re-trigger ad ogni render).

## Vincoli duri (non violare)

- **NON toccare** la scheda **"Intensità agosto-ottobre"**: è risolta.
- **NON pre-compilare la Pendulum**: la sistema Alice a mano.
- **RIR/RPE vuoti** in tutte le schede/progressioni.
- Modifiche al monolite **`src/app-main.js`** (non moduli additivi).
- Fase/progressioni **dai dati**, mai da tabelle seminate per nome.
- Mergiare ogni fase subito; bump versione a ogni fase.
- `#globalDivaBotHost` resta **fuori flusso** (`position: relative`, non `static`).

## Open questions / things to confirm next time

- FASE 3: confermare con Alice se bastano transizioni schermata+route+modali o se
  vuole anche transizioni dedicate ai tab interni di Allenamento.
- Confermare se le micro-animazioni (hover-lift, nav pop) sono della misura giusta.

## Default next actions if paused

1. Leggere `docs/memory-bank/progress_log.md` (checkpoint 16) e `AGENTS.md`.
2. Verificare suite verde (`node --test tests/*.test.mjs`, in background).
3. Aprire FASE 4 (Statistiche).

## Checkpoint 18 — FASE 3-ter DONE (v147.95-robottino-mobile)
- Diva Bot nel Workout ora **liberamente trascinabile** (posizione salvata in frazioni 0..1) e **mostra tutte le espressioni** (doppio tocco o menu). Fix del bug di drag che la teneva ancorata in alto a destra.
- Suite verde (237/228/0/9). Bump v147.95 (29 file).

## Default next actions if paused
1. Leggere `docs/memory-bank/progress_log.md` (checkpoint 18) e `AGENTS.md`.
2. Verificare suite verde (`node --test tests/*.test.mjs`, in background).
3. **FASE 4 (Statistiche)**: confermare lo scope con Alice prima di implementare.

## Checkpoint 19 — FASE 3-ter-bis DONE (v147.96-robottina-compagnia)
- Diva Bot ora fa le espressioni **contestuali** (in base a quello che scrivi/eventi reali) + una rotazione di "compagnia" lenta e discreta. Niente più tutte le facce assieme. Doppio tocco = un saluto.
- Il menu si chiude cliccando fuori o con Esc.
- Suite verde (237/228/0/9). Bump v147.96.
