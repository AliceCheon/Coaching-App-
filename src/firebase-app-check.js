// Firebase App Check - protezione contro abusi API
// Attiva App Check nel progetto Firebase Console prima di usare questo modulo.
// Documentazione: https://firebase.google.com/docs/app-check

(function (root) {
  "use strict";

  const APP_CHECK_DEBUG_TOKEN_KEY = "barbell-diva.appCheckDebugToken";

  function isDebugMode() {
    // Attiva il debug token solo in sviluppo locale (non su GitHub Pages)
    return location.hostname === "localhost" || location.hostname === "127.0.0.1";
  }

  function getDebugToken() {
    if (!isDebugMode()) return undefined;
    // In sviluppo, usa un token debug registrato nella console Firebase
    return localStorage.getItem(APP_CHECK_DEBUG_TOKEN_KEY) || undefined;
  }

  function initializeAppCheck(firebaseInstance, options = {}) {
    if (!firebaseInstance) {
      console.warn("[App Check] Firebase non disponibile.");
      return null;
    }
    if (!firebaseInstance.apps?.length) {
      console.warn("[App Check] Firebase non inizializzato.");
      return null;
    }
    try {
      const appCheck = firebaseInstance.appCheck();
      const provider = options.provider || firebaseInstance.appCheck.ReCaptchaEnterpriseProvider;
      appCheck.activate(provider, {
        isTokenAutoRefreshEnabled: true
      });
      console.log("[App Check] Inizializzato con successo.");
      return appCheck;
    } catch (error) {
      console.warn("[App Check] Inizializzazione non riuscita:", error?.message || error);
      return null;
    }
  }

  root.BarbellDivaAppCheck = Object.freeze({
    initializeAppCheck,
    isDebugMode,
    getDebugToken
  });
})(typeof window !== "undefined" ? window : globalThis);