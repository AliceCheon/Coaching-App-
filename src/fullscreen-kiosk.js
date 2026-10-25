/* Barbell Diva — Fullscreen / Kiosk (v148.25 "schermo-esterno")
   ---------------------------------------------------------------------------
   PERCHE' ESISTE
   Fino alla v148.24 il fullscreen era un `requestFullscreen()` cieco dentro
   index.html, riarmato su OGNI pointerdown/touchstart/keydown e protetto solo
   da un cancello di misura (altezza sotto 560px e larghezza sotto 760px).

   Tre difetti veri, tutti visti sul campo:
   1) SE LA RICHIESTA FALLISCE, NESSUNO LO SA. La promise veniva `.catch`-ata
      nel vuoto: l'app restava in finestra e non c'era modo di riprovare.
   2) IL PULSANTINO DI SISTEMA DIVENTA FREEZATO. Richiedendo il fullscreen a
      ogni tocco, l'app rientrava in fullscreen subito dopo che One UI ne era
      uscita (manico / "dimensione app" del cover screen): il comando di
      sistema veniva annullato un istante dopo, quindi sembrava morto.
   3) IL CANCELLO DI MISURA. Se One UI cambia le dimensioni della finestra
      (aggiornamento, manico, "dimensione app"), la finestra esce dal recinto
      560x760 e l'app non chiede PIU' il fullscreen: "non va piu' a schermo
      intero", senza un solo messaggio.

   COME FUNZIONA ORA
   - Una sola richiesta automatica per caricamento (primo gesto), e solo se
     l'app gira installata (standalone/fullscreen/minimal-ui), mai nel browser
     normale. Nessun riarmo a ogni tocco: il comando di sistema resta sovrano.
   - Pulsante in-app sempre visibile (`#bdFullscreenToggle`): funziona anche
     quando il pulsantino di Samsung e' bloccato.
   - Stato SEMPRE sincronizzato (`fullscreenchange` + prefissi vendor): se esci
     dal fullscreen in qualunque modo, il pulsante lo sa.
   - Se il browser rifiuta (permessi, gesture persa, TWA che ignora la
     richiesta) l'app NON resta a meta': attiva `html.bd-fill`, la modalita'
     "riempi schermo" via CSS, che non tocca lo stato di sistema (il manico
     Samsung continua a funzionare).
   - Ogni tentativo lascia traccia in `window.BarbellDivaFullscreen.diagnostics()`
     (es. `reject:NotAllowedError ...`), leggibile anche da
     `diagnostica-schermo.html`. Niente piu' fallimenti silenziosi.

   API PUBBLICA — window.BarbellDivaFullscreen
     supported() / isOn() / isNative() / isFill() / mode() / state()
     enter() / exit() / toggle()
     isAuto() / setAuto(bool)
     diagnostics()
   Evento: `bd:fullscreenchange` su window, detail = state().
   Preferenza: localStorage "barbell-diva.fullscreen" ("1" = automatico,
   "0" = mai automatico; spegnere col pulsante scrive "0").
*/
(function (root) {
  "use strict";

  var doc = root.document;
  if (!doc) return;

  var VERSION = "v148.25";
  var STORAGE_KEY = "barbell-diva.fullscreen";
  var ICON_OFF = "\u2922";   /* ⤢ espandi  */
  var ICON_ON = "\u2921";    /* ⤡ ripristina */

  var html = doc.documentElement;
  var button = null;
  var fillOn = false;
  var lastAttemptAt = 0;

  var diag = {
    version: VERSION,
    attempts: 0,
    nativeOk: 0,
    fillOk: 0,
    lastError: null,
    lastReason: null,
    lastChangeAt: 0,
    autoFired: false,
    events: []
  };

  function note(reason, error) {
    diag.lastReason = reason;
    if (error) {
      diag.lastError = {
        name: error.name || "Errore",
        message: error.message || String(error),
        at: Date.now()
      };
    }
    diag.lastChangeAt = Date.now();
    diag.events.push(reason + (error && error.name ? " (" + error.name + ")" : ""));
    while (diag.events.length > 12) diag.events.shift();
  }

  function storeGet(key) {
    try { return root.localStorage ? root.localStorage.getItem(key) : null; } catch (e) { return null; }
  }
  function storeSet(key, value) {
    try { if (root.localStorage) root.localStorage.setItem(key, value); } catch (e) { /* storage negato */ }
  }

  function nativeElement() {
    return doc.fullscreenElement || doc.webkitFullscreenElement ||
      doc.mozFullScreenElement || doc.msFullscreenElement || null;
  }
  function requestFn() {
    return html.requestFullscreen || html.webkitRequestFullscreen ||
      html.mozRequestFullScreen || html.msRequestFullscreen || null;
  }
  function exitFn() {
    return doc.exitFullscreen || doc.webkitExitFullscreen ||
      doc.mozCancelFullScreen || doc.msExitFullscreen || null;
  }

  function supported() { return typeof requestFn() === "function"; }
  function isNative() { return !!nativeElement(); }
  function isFill() { return fillOn; }
  function isOn() { return isNative() || fillOn; }
  function mode() { return isNative() ? "native" : (fillOn ? "fill" : "off"); }
  function isAuto() { return storeGet(STORAGE_KEY) !== "0"; }

  function state() {
    return {
      supported: supported(),
      on: isOn(),
      native: isNative(),
      fill: fillOn,
      mode: mode(),
      auto: isAuto(),
      attempts: diag.attempts,
      lastReason: diag.lastReason,
      lastError: diag.lastError,
      events: diag.events.slice()
    };
  }

  function paint() {
    if (!button) return;
    var m = mode();
    button.setAttribute("data-state", m);
    button.setAttribute("aria-pressed", isOn() ? "true" : "false");
    button.setAttribute("aria-label", isOn() ? "Esci da schermo intero" : "Schermo intero");
    button.title = isNative()
      ? "Schermo intero attivo — tocca per uscire"
      : (fillOn ? "Riempi schermo (senza fullscreen di sistema) — tocca per uscire" : "Schermo intero");
    while (button.firstChild) button.removeChild(button.firstChild);
    button.appendChild(doc.createTextNode(isOn() ? ICON_ON : ICON_OFF));
  }

  function emit() {
    var detail = state();
    try {
      var event;
      if (typeof root.CustomEvent === "function") event = new root.CustomEvent("bd:fullscreenchange", { detail: detail });
      else {
        event = doc.createEvent("CustomEvent");
        event.initCustomEvent("bd:fullscreenchange", false, false, detail);
      }
      root.dispatchEvent(event);
    } catch (e) { /* nessun ascoltatore / CustomEvent assente */ }
    paint();
  }

  function clearFill() {
    fillOn = false;
    try {
      html.classList.remove("bd-fill");
      delete html.dataset.bdFill;
    } catch (e) { /* dataset assente */ }
  }

  function applyFill(reason) {
    fillOn = true;
    try {
      html.classList.add("bd-fill");
      html.dataset.bdFill = "1";
    } catch (e) { /* dataset assente */ }
    diag.fillOk += 1;
    note("fill:" + reason);
  }

  function hint(message) {
    try {
      if (typeof root.showToast === "function") root.showToast(message);
    } catch (e) { /* toast non disponibile */ }
  }

  /* Sincrono per scelta: va chiamato DENTRO un gesto utente (click/pointerdown),
     senza await prima, altrimenti il browser perde l'attivazione e rifiuta. */
  function enter() {
    if (isNative()) { clearFill(); note("native:already"); emit(); return true; }

    lastAttemptAt = Date.now();
    diag.attempts += 1;

    var fn = requestFn();
    if (typeof fn !== "function") {
      note("unsupported");
      applyFill("unsupported");
      hint("Questo browser non consente lo schermo intero: uso la modalita' riempi schermo.");
      emit();
      return false;
    }

    var pending = null;
    try {
      pending = fn.call(html);
    } catch (error) {
      note("throw", error);
      applyFill("throw");
      emit();
      return false;
    }

    if (pending && typeof pending.then === "function") {
      pending.then(function () {
        if (nativeElement()) {
          clearFill();
          diag.nativeOk += 1;
          note("native:on");
        } else {
          /* Risolta senza entrare: TWA/One UI che ignora la richiesta. */
          applyFill("silent-noop");
        }
        emit();
      }, function (error) {
        note("reject", error);
        applyFill("reject");
        emit();
      });
    } else {
      /* Motori vecchi: nessuna promise, si verifica dopo un attimo. */
      root.setTimeout(function () {
        if (nativeElement()) { clearFill(); diag.nativeOk += 1; note("native:on"); }
        else { applyFill("silent-noop"); }
        emit();
      }, 320);
    }
    return true;
  }

  function exit() {
    storeSet(STORAGE_KEY, "0");   /* l'uscita esplicita spegne anche l'automatico */
    clearFill();
    var fn = exitFn();
    if (typeof fn !== "function" || !nativeElement()) { note("exit:fill-off"); emit(); return true; }
    var pending = null;
    try {
      pending = fn.call(doc);
    } catch (error) {
      note("exit-throw", error);
      emit();
      return false;
    }
    if (pending && typeof pending.then === "function") {
      pending.then(function () { note("exit:on"); emit(); }, function (error) { note("exit-reject", error); emit(); });
    } else {
      root.setTimeout(function () { note("exit:on"); emit(); }, 220);
    }
    return true;
  }

  function toggle() { return isOn() ? exit() : enter(); }

  function setAuto(enabled) {
    storeSet(STORAGE_KEY, enabled ? "1" : "0");
    if (!enabled && isOn()) exit();
    emit();
    return isAuto();
  }

  function makeButton() {
    if (button || !doc.body) return;
    var b = doc.createElement("button");
    b.type = "button";
    b.id = "bdFullscreenToggle";
    b.className = "bd-fs-toggle";
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = '<span aria-hidden="true"></span>';
    /* click = gesto fidato al 100%: MAI requestFullscreen su pointerdown qui,
       altrimenti il tap sul pulsante verrebbe consumato due volte. */
    b.addEventListener("click", function (event) {
      if (event && event.preventDefault) event.preventDefault();
      toggle();
    });
    b.addEventListener("pointerdown", function (event) {
      if (event && event.stopPropagation) event.stopPropagation();
    }, { passive: true });
    doc.body.appendChild(b);
    button = b;
    paint();
  }

  function boot() {
    makeButton();
    emit();
  }

  /* --- Ascolto dello stato reale: qualunque fullscreen, anche di sistema --- */
  ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"].forEach(function (name) {
    doc.addEventListener(name, function () {
      diag.lastChangeAt = Date.now();
      note(nativeElement() ? "change:native-on" : "change:native-off");
      emit();
    });
  });

  root.addEventListener("resize", paint);
  root.addEventListener("orientationchange", paint);
  root.addEventListener("pageshow", paint);

  /* --- Un solo tentativo automatico, per caricamento --- */
  function autoAllowed() {
    if (!isAuto()) return false;
    try {
      /* Nel browser normale il fullscreen sarebbe invadente: mai automatico. */
      if (root.matchMedia && root.matchMedia("(display-mode: browser)").matches) return false;
    } catch (e) { /* matchMedia assente */ }
    try {
      if (root.matchMedia && (
        root.matchMedia("(display-mode: standalone)").matches ||
        root.matchMedia("(display-mode: fullscreen)").matches ||
        root.matchMedia("(display-mode: minimal-ui)").matches)) return true;
    } catch (e) { /* matchMedia assente */ }
    return !!root.navigator.standalone;
  }

  function armAuto() {
    if (typeof requestFn() !== "function" || !autoAllowed()) return;
    var fired = false;
    var once = function () {
      if (fired) return;
      fired = true;
      diag.autoFired = true;
      if (!autoAllowed() || isOn()) return;
      enter();
    };
    try {
      root.addEventListener("pointerdown", once, { passive: true, once: true });
      root.addEventListener("touchstart", once, { passive: true, once: true });
      root.addEventListener("keydown", once, { once: true });
    } catch (e) {
      root.addEventListener("pointerdown", once);
    }
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", function () { boot(); armAuto(); });
  } else {
    boot();
    armAuto();
  }

  root.BarbellDivaFullscreen = Object.freeze({
    version: VERSION,
    STORAGE_KEY: STORAGE_KEY,
    supported: supported,
    isOn: isOn,
    isNative: isNative,
    isFill: isFill,
    mode: mode,
    state: state,
    isAuto: isAuto,
    setAuto: setAuto,
    enter: enter,
    exit: exit,
    toggle: toggle,
    diagnostics: function () {
      return {
        version: VERSION,
        state: state(),
        lastAttemptAt: lastAttemptAt,
        nativeSupported: supported(),
        displayModes: (function () {
          var modes = {};
          ["standalone", "fullscreen", "minimal-ui", "browser", "window-controls-overlay"].forEach(function (m) {
            try { modes[m] = !!(root.matchMedia && root.matchMedia("(display-mode: " + m + ")").matches); }
            catch (e) { modes[m] = null; }
          });
          return modes;
        })(),
        viewport: {
          innerWidth: root.innerWidth,
          innerHeight: root.innerHeight,
          screenWidth: root.screen ? root.screen.width : null,
          screenHeight: root.screen ? root.screen.height : null
        },
        events: diag.events.slice()
      };
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
