/**
 * App Integration Module - Barbell Diva
 * Robottina animata con espressioni e suoni - UNICA mascotte
 */
(function (root) {
  "use strict";

  // ==========================================
  // EXPRESSIONS - 7 stati d'animo
  // ==========================================
  const EXPRESSIONS = {
    happy: { eyes: "◕", mouth: "‿", color: "#ff6fcb" },
    excited: { eyes: "★", mouth: "D", color: "#ff9b49" },
    thinking: { eyes: "◑", mouth: "〰", color: "#a990ff" },
    concerned: { eyes: "◕", mouth: "︵", color: "#ff9b49" },
    celebrating: { eyes: "★", mouth: "D", color: "#69e6b0" },
    sleepy: { eyes: "−", mouth: "〰", color: "#666" },
    motivated: { eyes: "◕", mouth: "▽", color: "#ff6fcb" }
  };

  // ==========================================
  // SOUND EFFETTI
  // ==========================================
  const sounds = {
    pop: () => playTone(800, 0.1, "sine"),
    success: () => playTone(523, 0.1, "sine", 0.2),
    celebration: () => {
      playTone(523, 0.1, "sine", 0);
      playTone(659, 0.1, "sine", 0.1);
      playTone(784, 0.2, "sine", 0.2);
    },
    click: () => playTone(1000, 0.05, "square")
  };

  function playTone(frequency, duration, type = "sine", delay = 0) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);

      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + duration);
    } catch (e) {
      // Audio not supported
    }
  }

  // ==========================================
  // ROBOTTINA - Mascotte principale
  // ==========================================
  function createRobottina() {
    // Rimuovi eventuali altre mascotte
    const existingBot = document.getElementById("divaBot");
    if (existingBot) existingBot.remove();

    const robot = document.createElement("div");
    robot.id = "robottina";
    robot.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 70px;
      height: 70px;
      cursor: pointer;
      z-index: 9998;
      transition: transform 0.3s;
      user-select: none;
    `;

    // Faccia della robottina
    const face = document.createElement("div");
    face.id = "robottinaFace";
    face.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #ff6fcb 0%, #a990ff 100%);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(255, 111, 203, 0.4);
      animation: robottinaBounce 2s ease-in-out infinite, robottinaPulse 3s ease-in-out infinite;
    `;

    // Occhi
    const eyes = document.createElement("div");
    eyes.id = "robottinaEyes";
    eyes.style.cssText = `
      font-size: 18px;
      color: #fff;
      line-height: 1;
      margin-bottom: 2px;
    `;
    eyes.textContent = "◕ ◕";

    // Bocca
    const mouth = document.createElement("div");
    mouth.id = "robottinaMouth";
    mouth.style.cssText = `
      font-size: 14px;
      color: #fff;
      line-height: 1;
    `;
    mouth.textContent = "‿";

    face.appendChild(eyes);
    face.appendChild(mouth);
    robot.appendChild(face);

    // Hover effects
    robot.addEventListener("mouseenter", () => {
      robot.style.transform = "scale(1.1)";
      setExpression("excited");
      sounds.click();
    });

    robot.addEventListener("mouseleave", () => {
      robot.style.transform = "scale(1)";
      setExpression("happy");
    });

    // Click handler
    robot.addEventListener("click", () => {
      showMessage();
      sounds.pop();
    });

    document.body.appendChild(robot);
    addRobottinaStyles();
    return robot;
  }

  // Cambia espressione
  function setExpression(expression) {
    const face = document.getElementById("robottinaFace");
    const eyes = document.getElementById("robottinaEyes");
    const mouth = document.getElementById("robottinaMouth");

    if (!face || !eyes || !mouth) return;

    const expr = EXPRESSIONS[expression] || EXPRESSIONS.happy;
    eyes.textContent = `${expr.eyes} ${expr.eyes}`;
    mouth.textContent = expr.mouth;
    face.style.background = `linear-gradient(135deg, ${expr.color} 0%, #a990ff 100%)`;
  }

  // Mostra messaggio popup
  function showMessage() {
    const messages = [
      { text: "Ce la stai facendo benissimo! 💪", expr: "motivated" },
      { text: "Diva è orgogliosa di te! 💅", expr: "happy" },
      { text: "Non mollare, sei a metà strada! 🎯", expr: "motivated" },
      { text: "Ogni ripetizione conta! ✨", expr: "excited" },
      { text: "Sei più forte di quanto pensi! 🔥", expr: "excited" },
      { text: "Ricorda: tecnica prima del peso! 🎯", expr: "thinking" },
      { text: "Bevi acqua! I muscoli hanno sete! 💧", expr: "thinking" },
      { text: "Hai fatto il warmup? 🌡️", expr: "concerned" },
      { text: "Volume alto! Riposa un po' 🌸", expr: "concerned" },
      { text: "Streak di successo! Continua! 🔥", expr: "celebrating" }
    ];

    const msg = messages[Math.floor(Math.random() * messages.length)];
    setExpression(msg.expr);

    // Rimuovi popup esistente
    const existing = document.querySelector(".robottina-popup");
    if (existing) existing.remove();

    const popup = document.createElement("div");
    popup.className = "robottina-popup";
    popup.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      max-width: 250px;
      padding: 15px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #ff6fcb;
      border-radius: 15px;
      color: #fff;
      font-size: 13px;
      z-index: 9999;
      box-shadow: 0 10px 30px rgba(255, 111, 203, 0.3);
      animation: robottinaSlideUp 0.3s ease-out;
    `;

    popup.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="font-size: 24px;">🤖</span>
        <span style="color: #ff6fcb; font-weight: bold;">DIVA</span>
      </div>
      <div>${msg.text}</div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
      if (popup.parentNode) {
        popup.style.animation = "robottinaSlideUp 0.3s ease-out reverse";
        setTimeout(() => {
          popup.remove();
          setExpression("happy");
        }, 300);
      }
    }, 4000);
  }

  // ==========================================
  // STILE CSS
  // ==========================================
  function addRobottinaStyles() {
    if (document.getElementById("robottina-styles")) return;

    const styles = document.createElement("style");
    styles.id = "robottina-styles";
    styles.textContent = `
      @keyframes robottinaBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      @keyframes robottinaSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes robottinaPulse {
        0%, 100% { box-shadow: 0 4px 15px rgba(255, 111, 203, 0.4); }
        50% { box-shadow: 0 4px 25px rgba(255, 111, 203, 0.7); }
      }
      #robottina:hover {
        animation: none !important;
      }
    `;
    document.head.appendChild(styles);
  }

  // ==========================================
  // INIZIALIZZAZIONE
  // ==========================================
  function init() {
    // Crea la robottina (unica mascotte)
    setTimeout(createRobottina, 500);

    // Cambia espressione periodicamente
    setInterval(() => {
      const expressions = ["happy", "thinking", "motivated"];
      const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
      setExpression(randomExpr);
    }, 10000);
  }

  // Avvia quando il DOM è pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Esponi API
  root.BarbellDivaRobottina = Object.freeze({
    createRobottina,
    setExpression,
    showMessage,
    init
  });
})(typeof window !== "undefined" ? window : globalThis);