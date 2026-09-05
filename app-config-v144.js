// Configurazione Firebase integrata per Barbell Diva
import { initializeApp } from "https://gstatic.com";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "https://gstatic.com";
import { getFirestore } from "https://gstatic.com";

// NOTA: Assicurati che l'oggetto firebaseConfig contenga le TUE chiavi personali corrette se Codex/Claude le avevano messe qui.
// Se sotto vedi variabili vuote, mantieni quelle che avevi prima per le chiavi apiKey, authDomain ecc.
const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY || "", 
  authDomain: window.FIREBASE_AUTH_DOMAIN || "",
  projectId: window.FIREBASE_PROJECT_ID || "",
  storageBucket: window.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: window.FIREBASE_APP_ID || ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Funzione di Login sicura via Redirect (evita i blocchi del browser)
export function eseguiLoginGoogle() {
  signInWithRedirect(auth, googleProvider).catch((error) => {
    console.error("Errore durante il redirect di login:", error);
  });
}

// Controlla se l'utente ha appena completato il login dopo il redirect
export function controllaRitornoLogin() {
  return getRedirectResult(auth);
}

export function eseguiLogout() {
  return signOut(auth);
}

export { auth, db };
