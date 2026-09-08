/**
 * App Integration Module - Barbell Diva
 * Diva Bot - Robottina con espressioni facciali e suoni
 */
(function (root) {
  "use strict";

  // ==========================================
  // ESPRESSIONI FACCIALI
  // ==========================================
  const EXPRESSIONS = {
    happy: { eyes: "◕ ◕", mouth: "‿", color: "#ff6fcb", label: "😊" },
    excited: { eyes: "★ ★", mouth: "D", color: "#ff9b49", label: "🤩" },
    thinking: { eyes: "◑ ◑", mouth: "〰", color: "#a990ff", label: "🤔" },
    concerned: { eyes: "◕ ◕", mouth: "︵", color: "#ff9b49", label: "😟" },
    celebrating: { eyes: "★ ★", mouth: "D", color: "#69e6b0", label: "🎉" },
    sleepy: { eyes: "- -", mouth: "〰", color: "#666", label: "😴" },
    motivated: { eyes: "◕ ◕", mouth: "▽", color: "#ff6fcb", label: "💪" },
    love: { eyes: "♥ ♥", mouth: "‿", color: "#ff6fcb", label: "😍" },
    wink: { eyes: "◕ ◑", mouth: "‿", color: "#ff6fcb", label: "😉" },
    cool: { eyes: "▬ ▬", mouth: "‿", color: "#69e6b0", label: "😎" }
  };

  // ==========================================
  // SUONI
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
  // RIMUOVI IL PALLINO (non la robottina)
  // ==========================================
  function removePallino() {
    var pallino = document.getElementById("divaBot");
    if (pallino && !pallino.querySelector("#divaRobotFace")) {
      pallino.remove();
    }
  }

  // ==========================================
  // DIVA ROBOT - Mascotte principale
  // ==========================================
  function createDivaRobot() {
    removePallino();

    var robot = document.createElement("div");
    robot.id = "divaRobot";
    robot.style.cssText = "position: fixed; bottom: 20px; right: 20px; width: 80px; height: 80px; cursor: pointer; z-index: 9998; transition: transform 0.3s, box-shadow 0.3s; user-select: none;";

    var face = document.createElement("div");
    face.id = "divaRobotFace";
    face.style.cssText = "width: 100%; height: 100%; background: linear-gradient(135deg, #ff6fcb 0%, #a990ff 100%); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(255, 111, 203, 0.5); animation: robotBounce 2s ease-in-out infinite, robotPulse 3s ease-in-out infinite; border: 3px solid rgba(255, 255, 255, 0.3);";

    var eyes = document.createElement("div");
    eyes.id = "divaRobotEyes";
    eyes.style.cssText = "font-size: 20px; color: #fff; line-height: 1; margin-bottom: 4px; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);";
    eyes.textContent = "◕ ◕";

    var mouth = document.createElement("div");
    mouth.id = "divaRobotMouth";
    mouth.style.cssText = "font-size: 16px; color: #fff; line-height: 1; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);";
    mouth.textContent = "‿";

    var label = document.createElement("div");
    label.id = "divaRobotLabel";
    label.style.cssText = "position: absolute; top: -10px; right: -10px; font-size: 20px; animation: labelBounce 1s ease-in-out infinite;";
    label.textContent = "😊";

    face.appendChild(eyes);
    face.appendChild(mouth);
    face.appendChild(label);
    robot.appendChild(face);

    robot.addEventListener("mouseenter", function() {
      robot.style.transform = "scale(1.15)";
      robot.style.boxShadow = "0 8px 30px rgba(255, 111, 203, 0.7)";
      setExpression("excited");
      sounds.hover();
    });

    robot.addEventListener("mouseleave", function() {
      robot.style.transform = "scale(1)";
      robot.style.boxShadow = "0 4px 20px rgba(255, 111, 203, 0.5)";
      setExpression("happy");
    });

    robot.addEventListener("click", function() {
      showMessage();
      sounds.message();
    });

    document.body.appendChild(robot);
    addRobotStyles();
    return robot;
  }

  function setExpression(expression) {
    var face = document.getElementById("divaRobotFace");
    var eyes = document.getElementById("divaRobotEyes");
    var mouth = document.getElementById("divaRobotMouth");
    var label = document.getElementById("divaRobotLabel");

    if (!face || !eyes || !mouth || !label) return;

    var expr = EXPRESSIONS[expression] || EXPRESSIONS.happy;
    eyes.textContent = expr.eyes;
    mouth.textContent = expr.mouth;
    label.textContent = expr.label;
    face.style.background = "linear-gradient(135deg, " + expr.color + " 0%, #a990ff 100%)";
  }

  function showMessage() {
    var messages = [
      { text: "Ce la stai facendo benissimo! 💪", expr: "motivated" },
      { text: "Diva è orgogliosa di te! 💅", expr: "love" },
      { text: "Non mollare, sei a metà strada! 🎯", expr: "motivated" },
      { text: "Ogni ripetizione conta! ✨", expr: "excited" },
      { text: "Sei più forte di quanto pensi! 🔥", expr: "excited" },
      { text: "Ricorda: tecnica prima del peso! 🎯", expr: "thinking" },
      { text: "Bevi acqua! I muscoli hanno sete! 💧", expr: "thinking" },
      { text: "Hai fatto il warmup? 🌡️", expr: "concerned" },
      { text: "Volume alto! Riposa un po' 🌸", expr: "concerned" },
      { text: "Streak di successo! Continua! 🔥", expr: "celebrating" },
      { text: "Sei fantastica! 💖", expr: "love" },
      { text: "Dai che ce la fai! 💪", expr: "wink" },
      { text: "Che figata! 😎", expr: "cool" }
    ];

    var msg = messages[Math.floor(Math.random() * messages.length)];
    setExpression(msg.expr);

    var existing = document.querySelector(".diva-popup");
    if (existing) existing.remove();

    var popup = document.createElement("div");
    popup.className = "diva-popup";
    popup.style.cssText = "position: fixed; bottom: 110px; right: 20px; max-width: 280px; padding: 18px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #ff6fcb; border-radius: 18px; color: #fff; font-size: 14px; z-index: 9999; box-shadow: 0 10px 30px rgba(255, 111, 203, 0.4); animation: robotSlideUp 0.3s ease-out;";

    popup.innerHTML = '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;"><span style="font-size: 28px;">🤖</span><span style="color: #ff6fcb; font-weight: bold; font-size: 16px;">DIVA</span></div><div>' + msg.text + '</div>';

    document.body.appendChild(popup);

    setTimeout(function() {
      if (popup.parentNode) {
        popup.style.animation = "robotSlideUp 0.3s ease-out reverse";
        setTimeout(function() {
          popup.remove();
          setExpression("happy");
        }, 300);
      }
    }, 4000);
  }

  function addRobotStyles() {
    if (document.getElementById("diva-robot-styles")) return;

    var styles = document.createElement("style");
    styles.id = "diva-robot-styles";
    styles.textContent = "@keyframes robotBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } } @keyframes robotSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes robotPulse { 0%, 100% { box-shadow: 0 4px 20px rgba(255, 111, 203, 0.5); } 50% { box-shadow: 0 4px 30px rgba(255, 111, 203, 0.8); } } @keyframes labelBounce { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-5px) scale(1.1); } } #divaRobot:hover { animation: none !important; } #divaRobot:hover #divaRobotFace { animation: none !important; }";

    document.head.appendChild(styles);
  }

  function init() {
    removePallino();
    setTimeout(createDivaRobot, 500);
    setInterval(removePallino, 2000);

    setInterval(function() {
      var expressions = ["happy", "thinking", "motivated", "wink", "love"];
      var randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
      setExpression(randomExpr);
    }, 8000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  root.BarbellDivaRobot = {
    createDivaRobot: createDivaRobot,
    setExpression: setExpression,
    showMessage: showMessage,
    init: init
  };
})(typeof window !== "undefined" ? window : globalThis);