# Checkpoint — Coaching-App

UUID checkpoint: 0015
Ora (locale): 2026-10-07T08:30:00.000Z
Commit riferimento: `3503208` (Merge PR #13) — build `v147.92-editor-progressioni`

## Sommario

- **Editor progressioni settimana-per-settimana** nella sezione Progressioni
  (tabella Serie/Ripetizioni, salvata in `parameters.pattern`): l'utente scrive la
  sequenza da sola e vale su qualsiasi esercizio.
- I **metodi creati da zero** dall'utente ora compaiono in `progressionTemplates()`
  (prima venivano scartati → non selezionabili).
- I metodi **"Intensità:"** (ottobre-dicembre) producono la **sequenza reale** (non
  più il default 8-12). Il `pattern` è l'ultima parola nel generatore.
- Metodo 1 corretto con le **ultime schede** del foglio (`Lat_mono`/`Front_squat`).
- Rimosso un errore di sintassi a fine `src/app-main.js`.
- RIR/RPE **vuoti ovunque** (autoregolati a mano in allenamento).

## Stato attuale

- Build unica: `app-config-v144.js` → `build: "v147.92-editor-progressioni"`.
- Suite completa: **220 pass, 0 fail, 9 skipped** (229 test).
- `main` e GitHub Pages allineati; PR #13 mergiata.

## Blocchi aperti

- **CI "App smoke test"** (`.github/workflows/tests.yml`) fallisce su un'assertion
  stantia (`2026-08-31-sync-notes-v8-note-fallback`), pre-esistente dalla PR #10.
  NON correggibile dall'agente (GitHub App senza permesso `workflows`). Non blocca.

## Prossimi step consigliati

1. **FASE 3 — Animazioni + mascotte (Diva Bot)**: prossima fase richiesta da Alice.
2. (Poi) FASE 4 — Statistiche; FASE 5 — Coach AI.

## Note

- **VINCOLO URGENTE**: la scheda **"Intensità agosto-ottobre"** è RISOLTA, NON
  toccarla più. La **Pendulum** la sistema Alice a mano (non pre-compilarla).

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