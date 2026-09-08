/**
 * Diva Bot Suoni — bip sintetizzati via Web Audio API per ogni stato emotivo.
 * Zero asset da scaricare, dimensione ~2,5 KB.
 * Nessun suono se prefers-reduced-motion o AudioContext non disponibile.
 */
(function () {
  "use strict";

  const SOUND_MAP = {
    idle:        { wave: "sine",     freq: 220, dur: 0.18, vol: 0.10 },
    encouraging: { wave: "sine",     freq: 440, dur: 0.22, vol: 0.12, sweep: 1.5 },
    happy:       { wave: "triangle", freq: 520, dur: 0.18, vol: 0.10, double: true },
    celebrate:   { wave: "triangle", freq: 660, dur: 0.30, vol: 0.14, arpeggio: [523, 659, 784] },
    thinking:    { wave: "sine",     freq: 330, dur: 0.14, vol: 0.08, pulse: 2 },
    warning:     { wave: "sawtooth", freq: 360, dur: 0.20, vol: 0.10, sweep: 0.5 },
    rest:        { wave: "sine",     freq: 196, dur: 0.40, vol: 0.09, double: true },
    lifting:     { wave: "square",   freq: 290, dur: 0.16, vol: 0.10, drum: true }
  };

  let ctx = null;
  let muted = false;

  function getCtx() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      return ctx;
    } catch (_) { return null; }
  }

  function blip({ wave, freq, dur, vol, sweep, double, arpeggio, pulse, drum }, startAt) {
    const c = getCtx(); if (!c) return;
    const t0 = startAt || c.currentTime;

    const play = (f, len, when, type) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || wave;
      osc.frequency.setValueAtTime(f, when);
      if (sweep) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, f * sweep), when + len);
      }
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(vol, when + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + len);
      osc.connect(gain).connect(c.destination);
      osc.start(when);
      osc.stop(when + len + 0.02);
    };

    if (arpeggio) arpeggio.forEach((f, i) => play(f, dur * 0.9, t0 + i * dur * 0.6, "triangle"));
    else if (drum) {
      const osc = c.createOscillator(); const gain = c.createGain();
      osc.type = "square"; osc.frequency.setValueAtTime(120, t0);
      osc.frequency.exponentialRampToValueAtTime(40, t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(c.destination); osc.start(t0); osc.stop(t0 + dur + 0.02);
    } else if (double) { play(freq, dur, t0); play(freq * 1.25, dur, t0 + dur * 0.9); }
    else if (pulse && pulse > 1) { for (let i = 0; i < pulse; i++) play(freq, dur * 0.6, t0 + i * dur * 0.8); }
    else play(freq, dur, t0);
  }

  function playForState(state) {
    if (muted) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cfg = SOUND_MAP[state] || SOUND_MAP.idle;
    try { blip(cfg); } catch (_) {}
  }

  function attachSync() {
    const target = document.getElementById("globalDivaBotHost");
    if (!target || target.__divaBotSoundHooked) return;
    target.__divaBotSoundHooked = true;
    const obs = new MutationObserver(() => {
      const avatar = target.querySelector(".coach-avatar[data-coach-state]");
      if (avatar) playForState(avatar.getAttribute("data-coach-state"));
    });
    obs.observe(target, { attributes: true, subtree: true, attributeFilter: ["data-coach-state"] });
  }

  function init() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    const tap = () => { getCtx()?.resume?.(); document.removeEventListener("pointerdown", tap); };
    document.addEventListener("pointerdown", tap, { once: true });
    attachSync();
    setTimeout(attachSync, 400);
    setTimeout(attachSync, 1200);
  }

  window.BarbellDivaBotSounds = {
    playForState,
    setMuted: (v) => { muted = !!v; },
    isMuted: () => muted
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else { init(); }
})();
