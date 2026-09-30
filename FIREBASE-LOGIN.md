# Firebase e Login — Barbell Diva

> ⚠️ **Documento ricostruito.** Il contenuto precedente di questo file era una copia byte per
> byte di `decision-engine.js` (SHA256 `CD1890C5…`), non la documentazione del login.
> L'originale non era recuperabile (la history Git ha un solo commit "grafted").
> Questo testo è stato ricostruito **leggendo il codice**, con riferimenti di riga verificati.
> Vedi `docs/DOC-INTEGRITY-REPORT.md`.

## 1. Configurazione

La configurazione è centralizzata in `app-config-v144.js`, che espone
`window.BarbellDivaV144Config`:

| Chiave | Valore |
|--------|--------|
| `build` | `v147.59-primo-paint-fresco` |
| `cache` | `atlas-app-v14759-primo-paint-fresco` |
| `backupAutomaticLimit` | `5` |
| `firebase.projectId` | `barbell-diva` |
| `firebase.authDomain` | `barbell-diva.firebaseapp.com` |
| `firebase.storageBucket` | `barbell-diva.firebasestorage.app` |

`src/app-main.js:14-15` legge da lì `APP_BUILD` e `FIREBASE_CONFIG`. La chiave API nel file è
una **chiave web pubblica**: è normale per Firebase. La sicurezza dipende dalle regole
Firestore, non dal segreto della chiave.

## 2. SDK e ordine di caricamento

In `index.html:155-159`, prima di `src/app-main.js`:

```
firebase-app-compat.js        (v10.12.5, gstatic)
firebase-auth-compat.js
firebase-firestore-compat.js
firebase-app-check-compat.js
src/firebase-app-check.js
```

Si usa la build **compat** (namespace `window.firebase`), non quella modulare.

## 3. Flusso di autenticazione

| Passo | Dove |
|-------|------|
| Provider Google | `new window.firebase.auth.GoogleAuthProvider()` — `src/app-main.js:5511` |
| Login mobile (redirect) | `authService.signInWithRedirect(provider)` — `src/app-main.js:5515` |
| Login desktop (popup) | `authService.signInWithPopup(provider)` — `src/app-main.js:5518` |
| Ascolto dello stato | `authService.onAuthStateChanged(...)` — `src/app-main.js:4284` |
| Logout | `signOutGoogle()` — `src/app-main.js:5610` (usa `authService.signOut()`) |
| Bottone di logout | collegato a riga `12569` |

## 4. Dati su Firestore

- Collezione principale: `barbellDivaAccounts` (`CLOUD_COLLECTION`, `src/app-main.js:16`).
- Ogni utente accede **solo** al proprio documento (`request.auth.uid == userId`).
- Regole: `firestore.rules` (canonica) e `FIRESTORE-RULES-ACTIVE.txt` (copia leggibile).
- Sottoraccolte private (programmi, `sessions`, `stateBlobs`, ...): le regole autorizzano
  l'intero sottoalbero `barbellDivaAccounts/{uid}/**` al solo proprietario.

### Limite noto: 1 MiB per documento

Il documento radice ha superato il limite di **1 MiB** di Firestore, causando
`resource-exhausted / Write stream exhausted` (una singola scrittura troppo grande avvelena
lo stream). Soluzione implementata (v14737): i campi radice sopra **120 KB** vengono spostati
in documenti dedicati della sottoraccolta `stateBlobs`, scritti solo quando il contenuto
cambia (confronto per hash), con "delete sentinel" per rimuoverli dalla radice e fallback
retrocompatibile in lettura.

## 5. App Check — pronto, da accendere con la site key

- `src/firebase-app-check.js` è caricato (`index.html`) e ora viene **invocato** da
  `initFirebase()` (`src/app-main.js`), subito dopo `firebase.initializeApp`.
- L'attivazione è **guidata dalla configurazione**: `app-config-v144.js` → `appCheckSiteKey`.
  Finché è vuota, App Check resta spento e l'app non cambia.
- Per accenderlo davvero:
  1. Firebase Console → App Check → registra l'app web con **reCAPTCHA v3** (o Enterprise);
  2. copia la **site key** in `appCheckSiteKey` di `app-config-v144.js`;
  3. dopo aver visto traffico "verificato" in Console, attiva **Enforcement** su
     Cloud Firestore e Authentication.
- In locale il debug token resta su `localStorage: barbell-diva.appCheckDebugToken`.

## 6. Dati locali

- Chiave di stato: `alice-method-app.v8` (`STORE_KEY`, `src/app-main.js:2`).
- **Isolamento per account (Fase 4):** l'ultimo uid autenticato è in
  `alice-method-app.v8.lastAccountUid`. Se un **account diverso** accede sullo stesso
  dispositivo, `isolateLocalStateForAccount()` azzera lo stato locale (stato, journal,
  backup, coda di sync, bozze) PRIMA del merge, così i dati del profilo precedente non
  vengono mai scritti nel cloud del nuovo. Al primo login (nessun uid precedente) non si svuota nulla.
- Copie pre-merge anti-revert: `…premerge.v1` e `…premerge.prev.v1`.
- Journal dei workout: `…workoutJournal.v1` + IndexedDB `barbell-diva-workout-rescue`.

> Aprire sempre l'app da `http://127.0.0.1:8767/` (vedi `LEGGIMI-AVVIO-SICURO.txt`):
> con `file://` il browser usa un archivio diverso e gli allenamenti sembrano spariti.
