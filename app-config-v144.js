// FONTE UNICA della versione (Fase 0.5): build + cache vivono SOLO qui.
// Per rilasciare: aggiorna i due campi qui sotto, poi allinea i ?v= di
// index.html, manifest.webmanifest e CACHE_NAME di service-worker.js al nuovo
// token (v147.51 → "v14751"). Il test tests/version-single-source.test.mjs
// fallisce se anche un solo punto resta indietro.
(function (root) {
  root.BarbellDivaV144Config = Object.freeze({
    build: "v147.51-scheda-prima-fase-derivata",
    cache: "atlas-app-v14751-scheda-prima-fase-derivata",
    backupAutomaticLimit: 5,
    legacyModulesRemoved: ["nutrizione", "workout-pro"],
    firebase: Object.freeze({
      apiKey: "AIzaSyDW347rOPjsCSnUSRREh9e3wkZm37Myxdo",
      authDomain: "barbell-diva.firebaseapp.com",
      projectId: "barbell-diva",
      storageBucket: "barbell-diva.firebasestorage.app",
      messagingSenderId: "411536425865",
      appId: "1:411536425865:web:17bcd9f10b6ba1a9b49758",
      measurementId: "G-FNKXLKQFT8"
    })
  });
})(typeof window !== "undefined" ? window : globalThis);
