# Active Context — Coaching-App

Ultimo aggiornamento: vedi progress_log.md e checkpoint.md.

Use this section as the short “global context” that survives across parallel chats and task handoffs.

## Project snapshot

- Stack: JS/TS front-end + WASM/C++ module in scope; Electron-like (Chromium) window is the running target for UI integration work.
- Core domains:
  - Measurement Rig / tests — measurement flows, session data, weights/sequences.
  - Records / tests — history, summaries, stored datasets.
  - Logging / tests — retry queue, audit log, sync state.
- Recent focus:
  - Sync queue implementation (`createPersistentSyncQueue`) with in-memory + storage fallback and explicit status machine: pending/synced/failed/conflict/syncing.
  - Modularizzazione and cleanup of HTML-row helpers, including `coachInlineExerciseRowHtml`.

## Current state

- Latest commit: `fix: duplic \bato coachInlineExerciseRowHtml e test dopo modularizzazione`
- Active files of interest:
  - Sync queue implementation and usage sites.
  - Measurement rig test suite.
  - Records test suite.
  - Logging test suite.
- Checkpoint attuale: 0001

## Open questions / things to confirm next time

- WASM entrypoint filename and exported symbols used by JS.
- Last full test run results for measurement rig, records and logging (pass/fail/aperto).
- Whether the current sync queue behavior should be followed by additional logging/metrics work.

## Default next actions if paused

1. Refresh test status for measurement rig / records / logging.
2. If sync queue touched recently, re-validate status transitions.
3. If WASM interaction touched, confirm the used entrypoint and exports.