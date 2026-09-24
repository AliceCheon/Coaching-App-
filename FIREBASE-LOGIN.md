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
| `build` | `v147.52-fase-da-dati-programma` |
| `cache` | `atlas-app-v14752-fase-da-dati-programma` |
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
- Sottoraccolta `nutritionPhotos` per le foto nutrizione, privata come il documento padre.

### Limite noto: 1 MiB per documento

Il documento radice ha superato il limite di **1 MiB** di Firestore, causando
`resource-exhausted / Write stream exhausted` (una singola scrittura troppo grande avvelena
lo stream). Soluzione implementata (v14737): i campi radice sopra **120 KB** vengono spostati
in documenti dedicati della sottoraccolta `stateBlobs`, scritti solo quando il contenuto
cambia (confronto per hash), con "delete sentinel" per rimuoverli dalla radice e fallback
retrocompatibile in lettura.

## 5. App Check — ⚠️ NON ATTIVO

- Il modulo `src/firebase-app-check.js` è **caricato** (`index.html:159`) ma la funzione
  `initializeAppCheck()` **non viene chiamata da nessuna parte** nel repository.
- Quindi App Check **non è operativo**, anche se il `README.md` lo indica come protezione
  necessaria contro gli abusi delle API.
- Per attivarlo: registrare il sito in Firebase Console → App Check, poi invocare
  `window.BarbellDivaAppCheck.initializeAppCheck(firebase)` dopo l'inizializzazione di
  Firebase. In locale il modulo è già pronto per il debug token
  (`localStorage: barbell-diva.appCheckDebugToken`).

## 6. Dati locali

- Chiave di stato: `alice-method-app.v8` (`STORE_KEY`, `src/app-main.js:2`).
- Copie pre-merge anti-revert: `…premerge.v1` e `…premerge.prev.v1`.
- Journal dei workout: `…workoutJournal.v1` + IndexedDB `barbell-diva-workout-rescue`.

> Aprire sempre l'app da `http://127.0.0.1:8767/` (vedi `LEGGIMI-AVVIO-SICURO.txt`):
> con `file://` il browser usa un archivio diverso e gli allenamenti sembrano spariti.
