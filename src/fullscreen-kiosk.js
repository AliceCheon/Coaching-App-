/* Barbell Diva — Fullscreen / Kiosk (v148.26 "manico-vivo")
   ---------------------------------------------------------------------------
   PERCHE' ESISTE
   Fino alla v148.24 il fullscreen era un `requestFullscreen()` cieco dentro
   index.html, riarmato su OGNI pointerdown/touchstart/keydown e protetto solo
   da un cancello di misura (altezza sotto 560px e larghezza sotto 760px).

   v148.25 ha tolto il riarmo e aggiunto pulsante + stato + ripiego. Sul campo
   e' emerso il conflitto vero:

   FULLSCREEN NATIVO E MANICO DI SAMSUNG SI ESCLUDONO A VICENDA.
   Con la v148.25 in fullscreen nativo (tondino rosa) il manico / la barretta
   di One UI sul cover screen NON COMPARE PIU'. Non e' un guasto: il fullscreen
   nativo nasconde l'interfaccia di sistema, quindi si porta via anche il
   comando che serve a ridimensionare la finestra. Nella v148.24 il manico si
   vedeva solo perche' l'app non restava in fullscreen abbastanza a lungo:
   rientrava e usciva a ogni tocco ("pulsantino freezato").

   SCALA A TRE STATI (default: fill)
     off    -> app nella finestra com'e'
     fill   -> l'app riempie il viewport via CSS; sistema intatto, MANICO VIVO,
               nessuna richiesta al browser, nessun gesto necessario
     native -> fullscreen vero: nessuna interfaccia di sistema, manico assente
   Il tondino cicla off -> fill -> native -> off, quindi non intrappola mai.
   Default = fill: il manico e' quello che serve per gestire la finestra.

   ALTRE REGOLE
   - Al boot non si forza MAI il fullscreen nativo: si applica la preferenza.
   - Uscita di sistema dal fullscreen (gesto, ridimensionamento One UI) =>
     si passa a "fill": schermo pieno, manico vivo, finestra mai dimezzata.
   - Se il browser rifiuta il fullscreen, ripiego automatico su "fill" con
     traccia dell'errore: niente fallimenti silenziosi.
   - Ogni tentativo finisce in `window.BarbellDivaFullscreen.diagnostics()`.

   API — window.BarbellDivaFullscreen
     supported() / isOn() / isNative() / isFill() / mode() / pref() / state()
     enter() / fill() / exit() / toggle() / nextMode() / isInstalled()
     isAuto() / setAuto(bool)        (compatibilita' v148.25)
     diagnostics()
   Evento: `bd:fullscreenchange` su window, detail = state().
   Preferenza: localStorage "barbell-diva.fullscreen" = "off" | "fill" | "native"
   ("0" -> off, "1" -> fill, migrazione dalle versioni precedenti).
*/
(function (root) {
  "use strict";

  var doc = root.document;
  if (!doc) return;

  var VERSION = "v148.26";
  var STORAGE_KEY = "barbell-diva.fullscreen";
  var ICON_OFF = "\u2922";   /* expand  */
  var ICON_ON = "\u2921";    /* collapse */

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

  function pref() {
    var raw = storeGet(STORAGE_KEY);
    if (raw === "off" || raw === "fill" || raw === "native") return raw;
    if (raw === "0") return "off";
    if (raw === "1") return "fill";
    return "fill";
  }
  function setPref(value) { storeSet(STORAGE_KEY, value); }

  function nextMode() {
    var m = mode();
    if (m === "off") return "fill";
    if (m === "fill") return "native";
    return "off";
  }

  function isAuto() { return pref() !== "off"; }

  function state() {
    return {
      supported: supported(),
      on: isOn(),
      native: isNative(),
      fill: fillOn,
      mode: mode(),
      pref: pref(),
      next: nextMode(),
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
      ? "Fullscreen nativo: il manico Samsung resta nascosto — tocca per uscire"
      : (fillOn
        ? "Riempi schermo, manico Samsung vivo — tocca per il fullscreen nativo"
        : "Schermo intero");
    while (button.firstChild) button.removeChild(button.firstChild);
    button.appendChild(doc.createTextNode(isNative() ? ICON_ON : ICON_OFF));
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

  function isInstalled() {
    try {
      if (root.matchMedia && (
        root.matchMedia("(display-mode: standalone)").matches ||
        root.matchMedia("(display-mode: fullscreen)").matches ||
        root.matchMedia("(display-mode: minimal-ui)").matches)) return true;
    } catch (e) { /* matchMedia assente */ }
    return !!root.navigator.standalone;
  }

  /* Sincrono per scelta: va chiamato DENTRO un gesto utente, senza await prima,
     altrimenti il browser perde l'attivazione e rifiuta. */
  function enter() {
    if (isNative()) { clearFill(); note("native:already"); emit(); return true; }
    setPref("native");

    lastAttemptAt = Date.now();
    diag.attempts += 1;

    var fn = requestFn();
    if (typeof fn !== "function") {
      note("unsupported");
      applyFill("unsupported");
      setPref("fill");
      hint("Questo browser non consente il fullscreen: uso la modalita' riempi schermo.");
      emit();
      return false;
    }

    var pending = null;
    try {
      pending = fn.call(html);
    } catch (error) {
      note("throw", error);
      applyFill("throw");
      setPref("fill");
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
          setPref("fill");
        }
        emit();
      }, function (error) {
        note("reject", error);
        applyFill("reject");
        setPref("fill");
        emit();
      });
    } else {
      /* Motori vecchi: nessuna promise, si verifica dopo un attimo. */
      root.setTimeout(function () {
        if (nativeElement()) { clearFill(); diag.nativeOk += 1; note("native:on"); }
        else { applyFill("silent-noop"); setPref("fill"); }
        emit();
      }, 320);
    }
    return true;
  }

  /* "Riempi schermo": riempie il viewport via CSS e NON tocca lo stato di
     sistema, quindi il manico di One UI resta visibile e funzionante.
     Non richiede alcun gesto utente: si puo' applicare anche al boot. */
  function fill() {
    setPref("fill");
    if (isNative()) {
      var fn = exitFn();
      try { if (typeof fn === "function") fn.call(doc); } catch (e) { note("fill-exit-throw", e); }
    }
    applyFill("manual");
    emit();
    return true;
  }

  function exit() {
    setPref("off");
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

  /* Ciclo a tre stati: off -> fill -> native -> off. */
  function toggle() {
    var next = nextMode();
    if (next === "fill") return fill();
    if (next === "native") return enter();
    return exit();
  }

  function setAuto(enabled) {
    if (!enabled) { setPref("off"); if (isOn()) exit(); }
    else { setPref("fill"); }
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

  ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"].forEach(function (name) {
    doc.addEventListener(name, function () {
      diag.lastChangeAt = Date.now();
      var stillNative = !!nativeElement();
      note(stillNative ? "change:native-on" : "change:native-off");
      /* Uscita NON chiesta dall'app (gesto di sistema, ridimensionamento One UI):
         si passa a "fill". Schermo pieno, manico vivo, finestra mai dimezzata. */
      if (!stillNative && pref() === "native") {
        setPref("fill");
        applyFill("system-exit");
      }
      emit();
    });
  });

  root.addEventListener("resize", paint);
  root.addEventListener("orientationchange", paint);
  root.addEventListener("pageshow", paint);

  function autoAllowed() {
    if (!isAuto()) return false;
    try {
      /* Nel browser normale il fullscreen sarebbe invadente: mai automatico. */
      if (root.matchMedia && root.matchMedia("(display-mode: browser)").matches) return false;
    } catch (e) { /* matchMedia assente */ }
    return isInstalled();
  }

  /* Al boot non si forza MAI il fullscreen nativo: si applica la modalita'
     scelta. Con la preferenza "fill" (default) l'app riempie lo schermo via CSS
     e il manico di One UI resta vivo. */
  function applyBootMode() {
    if (!isInstalled()) return;
    if (pref() === "fill") applyFill("boot");
  }

  function armAuto() {
    if (typeof requestFn() !== "function" || !autoAllowed()) return;
    if (pref() !== "native") return;
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
    doc.addEventListener("DOMContentLoaded", function () { boot(); applyBootMode(); armAuto(); });
  } else {
    boot();
    applyBootMode();
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
    pref: pref,
    nextMode: nextMode,
    isInstalled: isInstalled,
    state: state,
    isAuto: isAuto,
    setAuto: setAuto,
    enter: enter,
    fill: fill,
    exit: exit,
    toggle: toggle,
    diagnostics: function () {
      return {
        version: VERSION,
        state: state(),
        pref: pref(),
        nextMode: nextMode(),
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
