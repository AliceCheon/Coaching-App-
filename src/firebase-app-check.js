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
    const siteKey = options.siteKey;
    if (!siteKey) {
      // Nessuna site key configurata: App Check resta spento, nessun errore.
      console.warn("[App Check] site key mancante (app-config-v144.js → appCheckSiteKey).");
      return null;
    }
    try {
      // Il provider va ISTANZIATO con la site key (non passato come classe).
      // Default reCAPTCHA v3 (registrazione più semplice); "enterprise" se richiesto.
      const providerName = String(options.provider || "v3").toLowerCase();
      const providerClass = providerName === "enterprise"
        ? firebaseInstance.appCheck?.ReCaptchaEnterpriseProvider
        : (firebaseInstance.appCheck?.ReCaptchaV3Provider || firebaseInstance.appCheck?.ReCaptchaEnterpriseProvider);
      if (!providerClass) {
        console.warn("[App Check] provider reCAPTCHA non disponibile negli SDK caricati.");
        return null;
      }
      if (isDebugMode()) {
        const debugToken = getDebugToken();
        if (debugToken) root.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
      }
      const provider = new providerClass(siteKey);
      const appCheck = firebaseInstance.appCheck();
      appCheck.activate(provider, options.isTokenAutoRefreshEnabled !== false);
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