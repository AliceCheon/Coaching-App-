/**
 * App Integration Module - Barbell Diva
 * Ex "pallina" delle espressioni facciali: rimossa. Restano solo suoni e
 * frasi motivazionali riutilizzabili, senza creare nessun elemento extra
 * nella pagina. La mascotte vera (bianca, con stati e animazioni) vive in
 * app-main.js + coach-studio-inline.css.
 */
(function (root) {
  "use strict";

  // ==========================================
  // SUONI (riutilizzabili, nessun DOM creato)
  // ==========================================
  const sounds = {
    pop: function() { playTone(800, 0.1, "sine"); },
    success: function() { playTone(523, 0.15, "sine"); },
    celebration: function() {
      playTone(523, 0.1, "sine", 0);
      playTone(659, 0.1, "sine", 0.1);
      playTone(784, 0.1, "sine", 0.2);
      playTone(1047, 0.2, "sine", 0.3);
    },
    click: function() { playTone(1000, 0.05, "square"); },
    hover: function() { playTone(600, 0.08, "sine"); },
    message: function() { playTone(440, 0.1, "sine", 0); playTone(550, 0.1, "sine", 0.1); }
  };

  function playTone(frequency, duration, type, delay) {
    delay = delay || 0;
    try {
      var audioContext = new (window.AudioContext || window.webkitAudioContext)();
      var oscillator = audioContext.createOscillator();
      var gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);

      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + duration);
    } catch (e) {
      // Audio not supported
    }
  }

  // ==========================================
  // FRASI MOTIVAZIONALI (disponibili per la Diva Bot vera, se servono)
  // ==========================================
  const MOTIVATIONAL_MESSAGES = [
    "Ce la stai facendo benissimo! 💪",
    "Diva è orgogliosa di te! 💅",
    "Non mollare, sei a metà strada! 🎯",
    "Ogni ripetizione conta! ✨",
    "Sei più forte di quanto pensi! 🔥",
    "Ricorda: tecnica prima del peso! 🎯",
    "Bevi acqua! I muscoli hanno sete! 💧",
    "Hai fatto il warmup? 🌡️",
    "Volume alto! Riposa un po' 🌸",
    "Streak di successo! Continua! 🔥",
    "Sei fantastica! 💖",
    "Dai che ce la fai! 💪",
    "Che figata! 😎"
  ];

  // ==========================================
  // PULIZIA DI SICUREZZA
  // ==========================================
  // Rimuove un eventuale elemento #divaRobot rimasto in cache da versioni
  // precedenti dell'app (la "pallina"). Non crea più nulla di nuovo.
  function removeLegacyBall() {
    var legacyBall = document.getElementById("divaRobot");
    if (legacyBall) legacyBall.remove();
    var legacyPopup = document.querySelector(".diva-popup");
    if (legacyPopup) legacyPopup.remove();
    var legacyStyles = document.getElementById("diva-robot-styles");
    if (legacyStyles) legacyStyles.remove();
  }

  function init() {
    removeLegacyBall();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  root.BarbellDivaRobot = Object.freeze({
    sounds: sounds,
    motivationalMessages: MOTIVATIONAL_MESSAGES
  });
})(typeof window !== "undefined" ? window : globalThis);
