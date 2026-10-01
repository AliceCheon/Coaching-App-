import fs from "node:fs/promises";

// v147.78 · Primo paint fresco: il primo render attende l'idratazione dalla
// cloud-cache (tetto 400ms) — lo schermo non mostra mai la foto locale vecchia
// quando sul cloud ne è vista una più nuova.
//
// Il blocco boot non è eseguibile nell'harness VM (viene stripped insieme a
// initFirebase), quindi la verifica è strutturale: ordine boot, tetto di attesa,
// e nessuna via di ritorno al render immediato pre-idratazione.

const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");

// 1 — Il primo render nasce dentro la race: idratazione prima, tetto 400ms
if (!/Promise\.race\(\s*\[\s*hydrateFromCloudSnapshotCache\(\)\.catch\(\(\) => false\),\s*new Promise\(\(resolve\) => \{ setTimeout\(resolve, 400\); \}\)\s*\]\)\.then\(\(\) => \{ render\(\); \}\);/.test(appMain)) {
  throw new Error("Il primo render non attende l'idratazione (race con tetto 400ms mancante o rimaneggiata)");
}

// 2 — Il vecchio fire-and-forget (render immediato su stato locale vecchio) è sparito
if (appMain.includes("hydrateFromCloudSnapshotCache().catch(() => {});")) {
  throw new Error("Il boot torna a idratare fire-and-forget: il primo paint ripartirebbe dalla foto vecchia");
}

// 3 — L'idratazione resta agganciata dopo initFirebase (design v147.57, test originario)
if (!/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*?hydrateFromCloudSnapshotCache\(\)\.catch/.test(appMain)) {
  throw new Error("L'idratazione non è più agganciata al boot dopo initFirebase");
}

// 4 — Laguardia offline/locale del primo paint: commento segnaletico presente
if (!appMain.includes("PRIMO PAINT FRESCO")) {
  throw new Error("Manca il commento segnaletico del primo paint fresco");
}

// 5 — L'idratazione registra in console l'esito (diagnostica su dispositivo)
if (!appMain.includes('console.info("[cloud-cache] Idratata dallo snapshot del cloud:')) {
  throw new Error("Manca la diagnostica di idratazione riuscita");
}
if (!appMain.includes('console.info("[cloud-cache] Idratazione saltata: cache assente o non valida')) {
  throw new Error("Manca la diagnostica di idratazione saltata");
}

// 6 — Le scritte della cache sono invariate (dopo download e dopo salvataggio)
const writeHooks = appMain.split("writeCloudSnapshotCache(cloudUser?.uid").length - 1;
if (writeHooks < 2) {
  throw new Error("Gli hook di scrittura della cloud-cache sono cambiati (attesi >= 2)");
}

console.log("v14778-dashboard-costanza: 6 verifiche strutturali passate");
