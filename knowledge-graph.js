# Login Google - Barbell diva

Il login Google e gia predisposto nell'app e le chiavi Firebase del progetto `barbell-diva` sono state inserite.

## Dove inserire le chiavi

Apri `index.html` e cerca:

```js
const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: ""
};
```

Questi valori sono gia compilati nella `v35`.

## Cosa attivare su Firebase

1. Crea un progetto Firebase.
2. Aggiungi una Web App.
3. In Authentication attiva Google.
4. In Firestore crea il database.
5. In Authentication > Settings > Authorized domains aggiungi il dominio GitHub Pages.
6. In Google Cloud > API key > Website restrictions consenti:
   - `https://alicecheon.github.io/*`
   - `https://alicecheon.github.io/Coaching-App-/*`
   - `https://barbell-diva.firebaseapp.com/*`

Il pulsante in Dashboard ora e operativo se Authentication Google e Firestore sono attivi nel progetto Firebase.

Se Firebase o la connessione non sono disponibili, l'app continua a funzionare e salvare in locale nel browser.
