/* Barbell Diva — Keep Awake (v147.42)
   Tiene acceso lo schermo del telefono mentre l'app è in uso: durante la seduta
   si annotano serie, RIR e recuperi, e il blocco schermo interrompe il flusso.

   - Usa la Screen Wake Lock API quando disponibile (Chrome/Edge/Android,
     Safari 16.4+). Su browser che non la supportano il modulo è un no-op.
   - Il browser RILASCIA il lock da solo quando la pagina va in background:
     alla riattivazione viene richiesto di nuovo (evento visibilitychange).
   - Preferenza in localStorage alla chiave "barbell-diva.keepAwake"
     (default: attivo). Spegnere il lock non spegne nessun'altra funzione.
   - API pubblica: window.BarbellDivaKeepAwake
       isSupported() / isEnabled() / setEnabled(bool) / isActive()
       activate() / release() / sync()
*/
(function (root) {
  "use strict";

  const STORAGE_KEY = "barbell-diva.keepAwake";
  const doc = root.document || null;
  const nav = root.navigator || null;

  let sentinel = null;
  let requesting = false;

  function storage() {
    try { return root.localStorage || null; } catch (error) { return null; }
  }

  function isSupported() {
    return !!(nav && nav.wakeLock && typeof nav.wakeLock.request === "function");
  }

  function isActive() {
    return !!(sentinel && !sentinel.released);
  }

  function isEnabled() {
    const store = storage();
    if (!store) return true;
    let raw = null;
    try { raw = store.getItem(STORAGE_KEY); } catch (error) { raw = null; }
    if (raw === null || raw === undefined) return true;
    return String(raw) !== "0";
  }

  function isVisible() {
    return !doc || doc.visibilityState !== "hidden";
  }

  async function activate(force = false) {
    if (!isSupported() || requesting) return false;
    if (!force && !isEnabled()) return false;
    // Con la pagina in background il browser rifiuta la richiesta: si riprova
    // al primo visibilitychange utile.
    if (!isVisible()) return false;
    if (isActive()) return true;
    requesting = true;
    try {
      const lock = await nav.wakeLock.request("screen");
      sentinel = lock || null;
      if (sentinel && typeof sentinel.addEventListener === "function") {
        sentinel.addEventListener("release", () => { if (sentinel === lock) sentinel = null; });
      }
      return isActive();
    } catch (error) {
      // NotAllowedError (pagina non visibile / permesso negato) o API assente:
      // non è un errore dell'utente, quindi si resta silenziosi.
      sentinel = null;
      return false;
    } finally {
      requesting = false;
    }
  }

  async function release() {
    const lock = sentinel;
    sentinel = null;
    if (!lock || typeof lock.release !== "function") return false;
    try { await lock.release(); } catch (error) { /* già rilasciato dal browser */ }
    return true;
  }

  function sync() {
    if (!isVisible()) { release(); return; }
    activate();
  }

  function setEnabled(enabled) {
    const store = storage();
    try { if (store) store.setItem(STORAGE_KEY, enabled ? "1" : "0"); } catch (error) { /* storage negato */ }
    if (enabled) activate(true); else release();
    return isEnabled();
  }

  if (doc && typeof doc.addEventListener === "function") {
    doc.addEventListener("visibilitychange", sync);
  }

  root.BarbellDivaKeepAwake = Object.freeze({
    STORAGE_KEY, isSupported, isEnabled, isActive, activate, release, sync, setEnabled
  });

  // Il file esiste proprio per tenere acceso lo schermo: parte attivo, salvo
  // scelta esplicita dell'utente (STORAGE_KEY = "0").
  if (isVisible()) activate();
})(typeof window !== "undefined" ? window : globalThis);
