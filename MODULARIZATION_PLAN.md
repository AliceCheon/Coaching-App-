# Piano di Modularizzazione — Barbell Diva

> Nota: questo file era stato sovrascritto per errore con il contenuto di `manifest.webmanifest`
> durante la sessione di estrazione CSS. Ripristinato l'8/9/2026.

## Obiettivo

Ridurre `index.html` (monolite da ~2 MB) spostando CSS e JavaScript in file esterni,
mantenendo il funzionamento della PWA (service worker, cache, versionamento `?v=`).

## Stato

### ✅ Completato

| Passo | Dettaglio |
|-------|-----------|
| Estrazione CSS inline | `<style>` di `index.html` → `coach-studio-inline.css`, sostituito da `<link rel="stylesheet" href="coach-studio-inline.css?v=v14723">` |
| Organizzazione documentazione | README/CHANGELOG/TEST-REPORT storici spostati in `docs/history/` |
| Moduli in `src/` | `src/utils.js` (modulo ES), `src/utils-global.js` (globali per script non-module), `src/firebase-app-check.js` |
| Service worker | `coach-studio-inline.css` e file `src/` aggiunti ad `APP_SHELL` (cache `atlas-app-v14725-modularizzazione`) |
| README / package.json | Aggiornati con struttura, script `dev`/`build`/`test` (Vite) |
| Fix codifica | Riparato il mojibake (doppia codifica UTF-8) introdotto dagli script PowerShell su `index.html` e `coach-studio-inline.css`; backup in `backup/*.pre-mojibake-fix.bak` |
| Estrazione script principale | Script inline (~2 MB) → `src/app-main.js`, caricato con `<script src="src/app-main.js?v=v14723"></script>`; `index.html` ridotto da ~2 MB a ~10 KB; backup in `backup/index.html.pre-appmain-extract.bak` |

### ⏳ Da fare

1. **Suddivisione di `src/app-main.js`** (opzionale): spezzarlo in moduli tematici
   (logbook, coach, dashboard, nutrizione) importandoli da un entry point.
   - Nota: lo script usa costanti globali (`STORE_KEY`, `APP_BUILD`, `FIREBASE_CONFIG`, …)
     condivise con gli altri script classici: la suddivisione richiede un'analisi
     delle dipendenze. Non usa `document.currentScript` (verificato).
2. **Versionamento**: bumpare `?v=` nei riferimenti aggiornati e il `CACHE_NAME`
   del service worker a ogni rilascio.
3. **Test**: eseguire `npm test` dopo ogni estrazione (richiede Node.js, attualmente
   non installato sulla macchina); verificare anche il flusso offline della PWA
   (l'`APP_SHELL` deve includere ogni nuovo file — `src/app-main.js` già aggiunto).

## Rischi

- **Ordine di caricamento**: gli script classici in `<head>` condividono globali;
  spostare codice può rompere l'ordine di inizializzazione.
- **Codifica**: usare sempre lettura/scrittura UTF-8 esplicita (gli script PowerShell 5.1
  di default leggono come ANSI: causa del mojibake già riparato).
- **Cache PWA**: un file estratto ma non in `APP_SHELL` manca in modalità offline.

## Script di supporto (Desktop)

- `extract-css.ps1` / `replace-css.ps1` / `verify-css.ps1` — estrazione CSS (⚠ usano encoding di default: da correggere con `-Encoding UTF8` prima di riutilizzarli)
- `organize-docs.ps1` — sposta la documentazione storica in `docs/history/`