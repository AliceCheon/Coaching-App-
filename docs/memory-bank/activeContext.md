# Active Context — Coaching-App

Ultimo aggiornamento: 2026-10-07 — build `v147.92-editor-progressioni`.

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
3. ⏳ **FASE 3 — Animazioni + mascotte (Diva Bot)** ← PROSSIMA.
4. ⏳ **FASE 4 — Statistiche**.
5. ⏳ **FASE 5 — Coach AI**.

## Current state

- **Build**: `v147.92-editor-progressioni`.
- **Ultimo commit**: `3503208` (Merge PR #13). PR #13:
  https://github.com/AliceCheon/Coaching-App-/pull/13 (mergiata).
- **Suite test**: **220 pass, 0 fail, 9 skipped** (229 test totali, ~8 min di durata →
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

## Prossimi step consigliati (FASE 3)

1. **FASE 3 — Animazioni + mascotte (Diva Bot)**. Punti di aggancio già in codebase:
   - `setCoachMascotState(stateName, options)` (app-main.js ~10572)
   - `playDivaBotSound(kind)` (~10106)
   - host `#globalDivaBotHost` (~7613), asset `coach-mascot.svg`
   - CSS: `coach-studio.css`, `coach-studio-inline.css` (badge `program-board-bot`)
   - stati già usati: `happy`, `celebrate` (es. dopo "Progressione applicata ✨").
   - Trappola nota: `#globalDivaBotHost` deve restare **fuori flusso**
     (`position: relative`, non `static`) — vedi AGENTS.md, altrimenti allunga il
     documento oltre `100dvh` sul cover screen.
2. (Poi) FASE 4 Statistiche, FASE 5 Coach AI.

## Vincoli duri (non violare)

- **NON toccare** la scheda **"Intensità agosto-ottobre"**: è risolta.
- **NON pre-compilare la Pendulum**: la sistema Alice a mano.
- **RIR/RPE vuoti** in tutte le schede/progressioni.
- Modifiche al monolite **`src/app-main.js`** (non moduli additivi).
- Fase/progressioni **dai dati**, mai da tabelle seminate per nome.
- Mergiare ogni fase subito; bump versione a ogni fase.

## Open questions / things to confirm next time

- FASE 3: quali animazioni esattamente Alice vuole (transizioni pagina? micro-animazioni
  su card/azioni? animazione della mascotte su azioni specifiche?).
- Confermare il perimetro: "animazioni + mascotte" — solo Diva Bot o anche motion UI
  generali (rispettando `prefers-reduced-motion`).

## Default next actions if paused

1. Leggere `docs/memory-bank/progress_log.md` (checkpoint 15) e `AGENTS.md`.
2. Verificare suite verde (`node --test tests/*.test.mjs`, in background).
3. Aprire FASE 3 concordando con Alice il dettaglio delle animazioni.
