# Checkpoint — Coaching-App

UUID checkpoint: 0016
Ora (locale): 2026-10-07T09:55:00.000Z
Commit riferimento: branch `genspark_ai_developer` — build `v147.93-animazioni` (base `802cbcc`, Merge PR #14)

## Sommario

- **FASE 3 — Animazioni + mascotte (Diva Bot)** implementata (perimetro: mascotte
  + motion UI generale, con modi `full`/`reduced`/`off`).
- 3.1 Transizioni: schermata (solo su cambio reale), route Coach Studio, ingresso modali.
- 3.2 Micro-animazioni: hover-lift (puntatori fini), nav pop; feedback serie già presente.
- 3.3 Mascotte: nuovi eventi `program_saved` e `backup_exported`.
- Guardia `tests/v14793-animazioni.test.mjs`.
- Bump: `node tools/bump-version.mjs v147.93-animazioni` (28 file).

## Stato attuale

- Build unica: `app-config-v144.js` → `build: "v147.93-animazioni"`.
- Branch di lavoro: `genspark_ai_developer`.

## Blocchi aperti

- **CI "App smoke test"** (`.github/workflows/tests.yml`) fallisce su un'assertion
  stantia (`2026-08-31-sync-notes-v8-note-fallback`), pre-esistente. NON correggibile
  dall'agente (GitHub App senza permesso `workflows`). Non blocca.

## Prossimi step consigliati

1. Merge FASE 3 su `main`.
2. **FASE 4 — Statistiche**.
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