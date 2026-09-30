# Design — Avvio parallelo e idratazione da cloud-cache

Proposta di progetto (v147.58 attesa). Data: 2026-09-30. Stato: **bozza approvata da Alice, da implementare**.
Sintomi che motiva: all'apertura dell'app i dati appaiono fermi a una vecchia data (es. 29 agosto) e
si aggiornano solo dopo ~10 secondi, quando il download da Firestore conclude e fonde i dati.

## 1. Diagnosi (verificata nel codice attuale)

Catena di avvio **seriale** — ogni anello attende il precedente:

```
boot (render da localStorage, STORE_KEY)                 src/app-main.js:1231
  → initFirebase() al module-eval                         :15032 (già subito, ok)
  → onAuthStateChanged (risoluzione token/sessione)       :4482
    → set account + render                                :4492-4512
    → loadCloudState({silent:false})                      :4537
       → doc.get() (timeout 40s)                          :5303
         → loadCloudPrograms(rootData)   SERIALE          :5308
         → loadCloudStateBlobs(rootData) SERIALE          :5310
         → loadCloudSessions(rootData)   SERIALE          :5313
       → mergeCloudAndLocalState + render                 :5318+
```

Tre aggravaatori, tutti verificati:

1. **Il primo download parte solo dopo l'auth.** `cloudDocument()` esige `cloudUser` (:4557-4560),
   che esiste solo dentro `onAuthStateChanged`. Ma l'uid è noto prima: `state.profile.account.uid`
   è già salvato in locale — il documento cloud è deterministico per uid
   (`CLOUD_COLLECTION/{uid}`). Attendere l'auth per *costruire il path* è attesa evitabile.
2. **Tre viaggi seriali dopo la `get()` della radice.** Programmi (sottoraccolta
   `nutritionPhotos`, :4562-4568), blob (:4582+) e sedute derivano tutti dallo stesso
   `rootData` e sono indipendenti fra loro: due round-trip interi regalati alla latenza.
3. **La copia locale è congelata di proposito quando il cloud è attivo.** `echoLocalStateQuietly`
   (:4029-4036): se `cloudUser && syncReady` fa `return true` **senza scrivere** localStorage.
   Il commento in `loadCloudState` (:5326-5329) promette "salviamo subito una copia silenziosa
   dello stato unito", ma la guardia la salta: **il paracadute non paracaduta**. Conseguenza:
   la fotografia locale resta a chiunque sia stato l'ultimo a scrivere con il cloud NON attivo —
   la "versione ferma al 29 agosto" è esattamente questo.

Non è colpa del service worker: JS/CSS sono network-first con fallback a 3s (service-worker.js:107-134),
il codice eseguito è sempre l'ultimo pubblicato.

## 2. Obiettivi

- **Stesso dispositivo**: all'apertura, dati del cloud visibili in <1 secondo, senza aspettare Firestore.
- **Dispositivo/browser nuovo** (cache vuota): come oggi come dati, ma con badge chiaro e download accorciato
  (auth e get in parallelo, sub-load in parallelo).
- **Nessuna regressione di correttezza**: il merge resta l'unico punto che tocca `state`; nessun dato
  più nuovo viene mai sovrascritto da uno più vecchio; nessuna seconda via di codice di merge.

## 3. Fix 1 — Login e primo download in parallelo

### 3.1 Download speculativo con l'ultimo uid noto

- All'avvio, subito dopo il primo render (slot `requestIdleCallback`/`setTimeout 0` per non competere
  col paint): se `navigator.onLine` e c'è un uid salvato, costruire il documento con una variante
  `cloudDocumentFor(uid)` e lanciare **subito** `doc.get()`, memorizzando la promise in
  `speculativeRoot = { uid, promise }`.
- L'SDK Firestore accoda da sé la richiesta finché il token non è pronto: la get "viaggia in parallelo"
  all'auth senza codice aggiuntivo.
- Quando `onAuthStateChanged` risolve:
  - **uid coincidente** → `loadCloudState` consuma `speculativeRoot.promise` al posto di rifare la `get()`
    (unica modifica al suo interno: un check prima di `doc.get()`). Il download è già in corso o finito.
  - **uid diverso o nessun utente** → la promise viene scartata e mai applicata (dato di un altro
    account o di nessuno). Nessun merge.
- `cloudLoading` continua a fare da guardia anti-sovrapposizione: lo scaricamento speculativo
  non apre una seconda via, è solo la `get()` della radice che parte prima.

### 3.2 Sub-load in parallelo

Dopo la `get()` della radice, `loadCloudPrograms` + `loadCloudStateBlobs` + `loadCloudSessions`
passano da `Promise.all` (presi tutti da `rootData`, indipendenti). Tre round-trip seriali → uno.
Il merge successivo resta identico e unico.

## 4. Fix 2 — Idratazione da cloud-cache prima di Firestore

### 4.1 Dove vive la cache

**Cache Storage** (la stessa usata dal service worker), chiave `atlas-cloud-snap-v1`, risposta
sintetica all'URL `/__cloud-snap-v1__`, corpo JSON:

```json
{ "schema": 1, "uid": "...", "updatedAt": "<stamp cloud>", "savedAt": "<iso>", "state": { ... } }
```

Perché non localStorage: la quota può essere esaurita (è l'ipotesi "errore locale"), mentre Cache
Storage condivide la quota della cache HTTP, molto più ampia, ed è già in uso nell'app. Contesto
sicuro richiesto: GitHub Pages è HTTPS, ok. Scrittura `put` che **sostituisce sempre l'unica voce**
(nessuna crescita nel tempo).

### 4.2 Quando si scrive (best-effort, mai bloccante, try/catch silenzioso)

- Dopo ogni **download** cloud riuscito: con il remoto com'è stato scaricato (radice + programmi +
  blob + sedute assemblati) e lo stamp `updatedAt` del cloud.
- Dopo ogni **scrittura** cloud riuscita: con il nuovo stamp e lo stato appena caricato.
  Così la cache contiene sempre "l'ultima versione vista sul cloud".

### 4.3 Quando si legge (idratazione)

All'avvio, nello stesso slot del download speculativo e comunque prima che l'auth risolva:

1. Leggere la cache (locale, veloce).
2. Applicare SOLO se: `schema` noto, `uid` == uid salvato in locale, `updatedAt` della cache
   **più nuovo** di `meta.updatedAt` locale (se il locale è più nuovo — es. allenamento registrato
   offline — la cache non aggiunge nulla e si salta).
3. Fondere con la STESSA `mergeCloudAndLocalState(state, cachedRemote)` (:4369): il vincitore è per
   stamp (:4373-4375), programmi e sedute in unione deduplicata — un remoto *vecchio* non può
   cancellare nulla di più nuovo, un remoto *più nuovo* (il caso che ci interessa) vince.
4. Segnare `lastCloudSnapshotAt = cached.updatedAt` (:1318): il primo `onSnapshot` con quello stamp
   viene filtrato come già visto (:4950), niente doppio merge; se il cloud è più nuovo, lo snapshot
   si applica normalmente.
5. Render + badge "Aggiorno dal cloud…" — poi il download live arriva, fonde di nuovo e il badge
   passa a "Sincronizzato".

### 4.4 UI

Riuso puro di ciò che esiste: `startPerceivedLoading("cloud")` (:7024, badge dopo 150ms, safety 16s)
e `setPremiumSaveStatus("syncing", "Aggiorno dal cloud…")` (:7036, nodo `#premiumSaveStatus`).
Nessun componente nuovo. Frase dedicata all'idratazione per non confonderla col salvataggio.

## 5. Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Dato stale a schermo senza spiegazione | Badge dedicato "Aggiorno dal cloud…" finché il live non arriva |
| Idratazione sovrascrive dati locali più nuovi | Guardia sullo stamp + merge per-stamp esistente: impossibile per costruzione |
| Dato di un altro account in cache | Guardia `uid` in lettura E scrittura; scarto silenzioso |
| Cache Storage assente (modalità privata) o pieno | try/catch ovunque: l'app degrada al comportamento attuale |
| Vecchia copia in localStorage ingannevole | La cloud-cache diventa la copia di ripartenza; il commento del "paracadute" va corretto (:5326) |
| Privacy | Stesso perimetro di localStorage: origine dell'app sul dispositivo, nessun nuovo canale |
| Quota Firestore | Una `get()` speculativa = 1 lettura; trascurabile |

## 6. Piano di lavoro (quando la implementiamo — flusso della skill)

1. **Test prima** (`tests/v14757-avvio-parallelo-cloud-cache.test.mjs`, modello: `v14756-motore-fasi-inferenza`):
   - idratazione: cache più nuova applicata; più vecchia saltata; uid diverso scartato; schema sconosciuto scartato;
   - `lastCloudSnapshotAt` aggiornato dall'idratazione (nessun doppio merge dal primo onSnapshot);
   - download speculativo: `get()` avviata con l'uid salvato prima dell'auth; consumata da `loadCloudState`
     senza seconda get; scartata se l'uid non coincide;
   - sub-load via `Promise.all` (verifica che non siano più sequenziali);
   - scrittura cache dopo download e dopo salvataggio riusciti; scrittura mai bloccante.
2. **Implementazione** in `src/app-main.js` (pattern IIFE + globali, una sola sezione nuova):
   `cloudDocumentFor(uid)`, `speculativeRoot`, `readCloudSnapshotCache()` / `writeCloudSnapshotCache()`,
   hook in `loadCloudState` (consume promise + Promise.all + write) e nel boot (read + merge + badge).
   Correggere il commento del paracadute (:5326-5329) per dire cosa fa davvero.
3. **Bump** con `bump_version.sh "v147.57-avvio-parallelo"` (patch+1 sul token attuale `v147.56-cursore-rir`,
   regola `vMAJOR+MINOR` → `v14757`).
4. **Suite completa** (~3 min, verde obbligatoria), checkpoint 12 nel progress_log, commit,
   **riepilogo e conferma di Alice**, push.

## 7. Effetto atteso

- Stesso dispositivo: la "versione di agosto" sparisce — si riparte dall'ultimo stato visto sul cloud
  (di norma l'ultimo allenamento), entro il primo secondo.
- Dispositivo nuovo: come oggi ma con badge onesto e download più corto (auth parallelizzata + sub-load uniti).
- I ~10 secondi rimasti (download live) diventano trasparenti: si vedono dati buoni subito, e il
  "Sincronizzato" finale è la conferma, non la speranza.
