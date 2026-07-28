// Configurazione minima condivisa della build v145.
(function (root) {
  root.BarbellDivaV144Config = Object.freeze({
    build: "v145",
    cache: "atlas-app-v145",
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
