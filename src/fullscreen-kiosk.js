/* Barbell Diva — Fullscreen / Kiosk (v148.28 "scelta-schermo")
   ---------------------------------------------------------------------------
   STORIA, in breve (per non ripetere gli errori)
   - v148.24 e prima: `requestFullscreen()` a ogni tocco -> combattere il
     comando di sistema (sembrava "freezato") e spegnersi in silenzio.
   - v148.25: una sola richiesta automatica + pulsante + stato + ripiego.
     Sul campo: fullscreen nativo attivo, manico Samsung sparito.
   - v148.26: scala a tre stati, default `fill` (riempimento CSS).
   - v148.27: scoperto che il manifest diceva `display: fullscreen`: One UI 9
     lo applica alla lettera e sopprime l'interfaccia di sistema. Ora standalone.
   - v148.28 (questa): il manico NON compare nemmeno in Chrome dal cover screen.
     Non e' l'app, non e' il manifest: One UI 9 ha rimosso la maniglia dal cover
     screen. Inseguirla e' tempo perso. Quindi l'app basta a se stessa:
     un pulsante leggibile "SCHERMO" apre un pannello con TRE scelte chiare.

   COME FUNZIONA
     off    -> app nella finestra com'e'
     fill   -> riempie il viewport via CSS, sistema intatto (default)
     native -> fullscreen vero, il sistema nasconde le sue barre
   Si sceglie dal pannello. Niente cicli alla cieca, niente gesti da indovinare.

   API — window.BarbellDivaFullscreen
     supported / isOn / isNative / isFill / mode / pref / state / nextMode
     enter / fill / exit / toggle / openSheet / closeSheet / isInstalled
     isAuto / setAuto / diagnostics
   Evento: `bd:fullscreenchange` su window, detail = state().
   Preferenza: localStorage "barbell-diva.fullscreen" = "off" | "fill" | "native"
   ("0" -> off, "1" -> fill, migrazione dalle versioni precedenti).
*/
(function (root) {
  "use strict";

  var doc = root.document;
  if (!doc) return;

  var VERSION = "v148.28";
  var STORAGE_KEY = "barbell-diva.fullscreen";
  var ICON_OFF = "\u2922";   /* expand   */
  var ICON_ON = "\u2921";    /* collapse */

  var html = doc.documentElement;
  var button = null;
  var iconEl = null;
  var sheet = null;
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
    button.setAttribute("aria-label", "Scegli come usare lo schermo");
    button.title = isNative()
      ? "Fullscreen vero: il sistema nasconde le sue barre — tocca per cambiare"
      : (isFill()
        ? "Riempi schermo attivo — tocca per cambiare"
        : "Scegli come usare lo schermo");
    if (iconEl) iconEl.textContent = isNative() ? ICON_ON : ICON_OFF;
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

  /* Sincrono per scelta: va chiamato DENTRO un gesto utente, senza await prima. */
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
      root.setTimeout(function () {
        if (nativeElement()) { clearFill(); diag.nativeOk += 1; note("native:on"); }
        else { applyFill("silent-noop"); setPref("fill"); }
        emit();
      }, 320);
    }
    return true;
  }

  /* "Riempi schermo": riempie il viewport via CSS e NON tocca lo stato di
     sistema. Non richiede gesti: si puo' applicare anche al boot. */
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

  /* ---- Pannello "Come vuoi lo schermo?" ---------------------------------- */
  var SHEET_ROWS = [
    { mode: "off", title: "Normale", note: "L'app resta nella sua finestra." },
    { mode: "fill", title: "Riempi schermo", note: "Consigliato: usa tutto lo spazio visibile." },
    { mode: "native", title: "Fullscreen vero", note: "Tutto lo spazio, ma il sistema nasconde le sue barre." }
  ];

  function closeSheet() {
    if (sheet && sheet.parentNode) sheet.parentNode.removeChild(sheet);
    sheet = null;
  }

  function openSheet() {
    if (sheet) { closeSheet(); return; }
    if (!doc.body) return;

    var wrap = doc.createElement("div");
    wrap.className = "bd-fs-sheet";
    wrap.id = "bdFullscreenSheet";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", "Scegli come usare lo schermo");

    var card = doc.createElement("div");
    card.className = "bd-fs-sheet-card";

    var title = doc.createElement("h2");
    title.textContent = "Come vuoi lo schermo?";
    card.appendChild(title);

    var intro = doc.createElement("p");
    intro.className = "bd-fs-sheet-intro";
    intro.textContent = "One UI 9 ha tolto il pulsantino Samsung dal cover screen: ora lo scegli qui.";
    card.appendChild(intro);

    SHEET_ROWS.forEach(function (row) {
      var option = doc.createElement("button");
      option.type = "button";
      option.className = "bd-fs-option";
      option.setAttribute("data-mode", row.mode);
      if (mode() === row.mode) option.setAttribute("data-current", "1");
      var t = doc.createElement("strong");
      t.textContent = row.title;
      var n = doc.createElement("span");
      n.textContent = row.note;
      option.appendChild(t);
      option.appendChild(n);
      option.addEventListener("click", function () {
        if (row.mode === "off") exit();
        else if (row.mode === "fill") fill();
        else enter();
        closeSheet();
      });
      card.appendChild(option);
    });

    var close = doc.createElement("button");
    close.type = "button";
    close.className = "bd-fs-close";
    close.textContent = "Chiudi";
    close.addEventListener("click", closeSheet);
    card.appendChild(close);

    wrap.appendChild(card);
    wrap.addEventListener("click", function (event) { if (event.target === wrap) closeSheet(); });
    doc.body.appendChild(wrap);
    sheet = wrap;
  }

  /* ---- Pulsante "SCHERMO" ----------------------------------------------- */
  function makeButton() {
    if (button || !doc.body) return;
    var b = doc.createElement("button");
    b.type = "button";
    b.id = "bdFullscreenToggle";
    b.className = "bd-fs-toggle";
    b.setAttribute("aria-pressed", "false");

    var icon = doc.createElement("span");
    icon.className = "bd-fs-icon";
    icon.setAttribute("aria-hidden", "true");
    var label = doc.createElement("span");
    label.className = "bd-fs-label";
    label.textContent = "SCHERMO";
    b.appendChild(icon);
    b.appendChild(label);

    /* click = gesto fidato al 100% (serve a requestFullscreen). */
    b.addEventListener("click", function (event) {
      if (event && event.preventDefault) event.preventDefault();
      openSheet();
    });
    b.addEventListener("pointerdown", function (event) {
      if (event && event.stopPropagation) event.stopPropagation();
    }, { passive: true });

    doc.body.appendChild(b);
    button = b;
    iconEl = icon;
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
      if (root.matchMedia && root.matchMedia("(display-mode: browser)").matches) return false;
    } catch (e) { /* matchMedia assente */ }
    return isInstalled();
  }

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
    openSheet: openSheet,
    closeSheet: closeSheet,
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
