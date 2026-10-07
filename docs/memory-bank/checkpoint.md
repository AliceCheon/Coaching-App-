# Checkpoint — Coaching-App

UUID checkpoint: 0017
Ora (locale): 2026-10-07T10:30:00.000Z
Commit riferimento: branch `genspark_ai_developer` — build `v147.94-animazioni` (base `a3dcb39`, Merge PR #15)

## Sommario

- **FASE 3-bis — Animazioni più evidenti (non invasive)** implementata, dopo il
  riscontro di Alice ("Non noto molto cambiamenti").
- Transizioni più marcate (16px/18px/22px), **entrata a cascata** della route
  (`premiumStagger`), **"pop" della mascotte** ad ogni reazione (`mascotPop` +
  `popCoachMascot()`); degradazioni `reduced`/`off` garantite.
- Guardia `tests/v14793-animazioni.test.mjs` estesa (8 test).
- Bump: `node tools/bump-version.mjs v147.94-animazioni` (29 file) → il
  `CACHE_NAME` del SW cambia e il PWA scarica subito la versione nuova (causa
  principale del "non vedo cambiamenti").

## Stato attuale

- Build unica: `app-config-v144.js` → `build: "v147.94-animazioni"`.
- Branch di lavoro: `genspark_ai_developer`.

## Blocchi aperti

- **CI "App smoke test"** (`.github/workflows/tests.yml`) fallisce su un'assertion
  stantia (`2026-08-31-sync-notes-v8-note-fallback`), pre-esistente. NON correggibile
  dall'agente (GitHub App senza permesso `workflows`). Non blocca.

## Prossimi step consigliati

1. Merge FASE 3-bis su `main`.
2. **FASE 4 — Statistiche** (moduli già presenti ma mai agganciati:
   `src/goals-stats.js`, `src/progress-charts.js`, `src/consistency-heatmap.js`).
3. (Poi) FASE 5 — Coach AI.

## Note

- **VINCOLO URGENTE**: la scheda **"Intensità agosto-ottobre"** è RISOLTA, NON
  toccarla più. La **Pendulum** la sistema Alice a mano (non pre-compilarla).
- `#globalDivaBotHost` deve restare **fuori flusso** (`position: relative`).

---

## Cronologia checkpoint generati dal trigger

### 1) 2026-09-11T11:25:00.000Z

- UUID: 0001
- Commit riferimento: b8a7ce1
- Cosa è cambiato: setup memory bank con aggiornamento automatico dei checkpoint.
- Stato/evidenza attuale: memory bank pronta, structure invariata su activeContext.md e progress_log.md.
- Blocco aperto: nessuno.
- Prossimo step consigliato: definire il trigger automatico ogni tot task/commit.

### 2) 2026-10-07T08:30:00.000Z

- UUID: 0015
- Commit riferimento: `3503208` (Merge PR #13) — build `v147.92-editor-progressioni`
- Cosa è cambiato: editor progressioni settimana-per-settimana; metodi personali
  selezionabili; sequenze reali dei metodi "Intensità:" (pattern come ultima parola);
  metodo 1 allineato alle ultime schede; fix errore di sintassi EOF; RIR/RPE vuoti.
- Stato/evidenza attuale: suite verde 220/0/9; `main` = Pages allineati; PR #13 mergiata.
- Blocco aperto: smoke test CI stantio (permessi `workflows` assenti) — non bloccante.
- Prossimo step consigliato: **FASE 3 (animazioni + mascotte Diva Bot)**.