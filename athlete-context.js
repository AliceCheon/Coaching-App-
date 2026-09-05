import { auth, db, controllaRitornoLogin } from "./app-config-v144.js";
import { onAuthStateChanged } from "https://gstatic.com";
import { doc, getDoc, setDoc } from "https://gstatic.com";

// Stato locale dell'applicazione
let datiApplicazione = {
  programmi: [],
  libreriaEsercizi: [],
  schede: []
};

let utenteCorrenteId = null;

// Gestione dell'autenticazione automatica (Stile Videogioco Cloud)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    utenteCorrenteId = user.uid;
    console.log("Utente sincronizzato nel Cloud con ID:", utenteCorrenteId);
    await scaricaDatiDalCloud();
  } else {
    utenteCorrenteId = null;
    console.log("Nessun utente rilevato. I salvataggi saranno solo temporanei localmente.");
    caricaDatiLocaliDiBackup();
  }
});

// Controlla se siamo appena tornati dalla pagina di login di Google
controllaRitornoLogin().then((result) => {
  if (result?.user) {
    console.log("Login completato con successo per:", result.user.displayName);
  }
}).catch((error) => {
  console.error("Errore nel recupero del login:", error);
});

// Sincronizzazione 1: SCARICA i dati da Firebase quando apri l'app
async function scaricaDatiDalCloud() {
  if (!utenteCorrenteId) return;
  try {
    const docRef = doc(db, "utenti", utenteCorrenteId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const datiCloud = docSnap.data();
      datiApplicazione.programmi = datiCloud.programmi || [];
      datiApplicazione.libreriaEsercizi = datiCloud.libreriaEsercizi || [];
      datiApplicazione.schede = datiCloud.schede || [];
      console.log("Dati scaricati dal Cloud e applicati con successo!");
      
      // Notifica all'interfaccia grafica (PWA) di aggiornare lo schermo
      aggiornaInterfacciaGrafica();
    } else {
      console.log("Nuovo utente: nessun dato presente nel Cloud. Creato profilo vuoto.");
    }
  } catch (error) {
    console.error("Errore durante lo scaricamento dei dati cloud:", error);
  }
}

// Sincronizzazione 2: SALVA i dati su Firebase ogni volta che fai una modifica
export async function salvaDatiNelCloud(nuoviProgrammi, nuovaLibreria, nuoveSchede) {
  // Aggiorna prima lo stato locale per reattività immediata
  if (nuoviProgrammi) datiApplicazione.programmi = nuoviProgrammi;
  if (nuovaLibreria) datiApplicazione.libreriaEsercizi = nuovaLibreria;
  if (nuoveSchede) datiApplicazione.schede = nuoveSchede;

  // Salva anche nel LocalStorage come backup offline di emergenza
  localStorage.setItem("barbell_diva_backup", JSON.stringify(datiApplicazione));

  if (!utenteCorrenteId) {
    console.warn("Attenzione: Dati salvati solo in locale. Accedi con Google per sincronizzarli nel Cloud.");
    return;
  }

  try {
    const docRef = doc(db, "utenti", utenteCorrenteId);
    await setDoc(docRef, {
      programmi: datiApplicazione.programmi,
      libreriaEsercizi: datiApplicazione.libreriaEsercizi,
      schede: datiApplicazione.schede,
      ultimoAggiornamento: new Date().toISOString()
    }, { merge: true });
    
    console.log("Sincronizzazione Cloud Riuscita!");
  } catch (error) {
    console.error("Errore fatale durante il salvataggio nel Cloud:", error);
    alert("Errore di sincronizzazione! Controlla la tua connessione.");
  }
}

function caricaDatiLocaliDiBackup() {
  const backup = localStorage.getItem("barbell_diva_backup");
  if (backup) {
    datiApplicazione = JSON.parse(backup);
    aggiornaInterfacciaGrafica();
  }
}

function aggiornaInterfacciaGrafica() {
  // Questo evento comunica a Codex/Interfaccia che i dati sono pronti e cambiati
  const eventoDatiPronti = new CustomEvent("datiSincronizzati", { detail: datiApplicazione });
  window.dispatchEvent(eventoDatiPronti);
}

export { datiApplicazione };
