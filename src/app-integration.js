/**
 * App Integration Module - Barbell Diva
 * Robottina animata con espressioni e suoni
 */
(function (root) {
  "use strict";

  // ==========================================
  // DIVA ROBOT - Mascotte animata
  // ==========================================

  // Robot expressions
  const EXPRESSIONS = {
    happy: { eyes: "◕", mouth: "‿", color: "#ff6fcb" },
    excited: { eyes: "★", mouth: "D", color: "#ff9b49" },
    thinking: { eyes: "◑", mouth: "〰", color: "#a990ff" },
    concerned: { eyes: "◕", mouth: "︵", color: "#ff9b49" },
    celebrating: { eyes: "★", mouth: "D", color: "#69e6b0" },
    sleepy: { eyes: "−", mouth: "〰", color: "#666" },
    motivated: { eyes: "◕", mouth: "▽", color: "#ff6fcb" }
  };

  // Sound effects (using Web Audio API)
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
    } catch {
      // Audio not supported
    }
  }

  // Create animated Diva Robot
  function createDivaRobot() {
    const robot = document.createElement("div");
    robot.id = "divaRobot";
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

    // Robot face container
    const face = document.createElement("div");
    face.id = "divaRobotFace";
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
      animation: robotBounce 2s ease-in-out infinite;
      position: relative;
    `;

    // Eyes
    const eyes = document.createElement("div");
    eyes.id = "divaRobotEyes";
    eyes.style.cssText = `
      font-size: 18px;
      color: #fff;
      line-height: 1;
      margin-bottom: 2px;
    `;
    eyes.textContent = "◕ ◕";

    // Mouth
    const mouth = document.createElement("div");
    mouth.id = "divaRobotMouth";
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
      showDivaPopup();
      sounds.pop();
    });

    document.body.appendChild(robot);

    // Add robot styles
    addRobotStyles();

    return robot;
  }

  // Set robot expression
  function setExpression(expression) {
    const face = document.getElementById("divaRobotFace");
    const eyes = document.getElementById("divaRobotEyes");
    const mouth = document.getElementById("divaRobotMouth");

    if (!face || !eyes || !mouth) return;

    const expr = EXPRESSIONS[expression] || EXPRESSIONS.happy;

    eyes.textContent = `${expr.eyes} ${expr.eyes}`;
    mouth.textContent = expr.mouth;
    face.style.background = `linear-gradient(135deg, ${expr.color} 0%, #a990ff 100%)`;
  }

  // Show Diva popup message
  function showDivaPopup() {
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

    // Set robot expression
    setExpression(msg.expr);

    // Remove existing popup
    const existing = document.querySelector(".diva-popup");
    if (existing) existing.remove();

    const popup = document.createElement("div");
    popup.className = "diva-popup";
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
      animation: divaSlideUp 0.3s ease-out;
    `;

    popup.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="font-size: 24px;">🤖</span>
        <span style="color: #ff6fcb; font-weight: bold;">DIVA</span>
      </div>
      <div>${msg.text}</div>
    `;

    document.body.appendChild(popup);

    // Auto remove after 4 seconds
    setTimeout(() => {
      if (popup.parentNode) {
        popup.style.animation = "divaSlideUp 0.3s ease-out reverse";
        setTimeout(() => {
          popup.remove();
          setExpression("happy");
        }, 300);
      }
    }, 4000);
  }

  // ==========================================
  // QUICK LOG BUTTON
  // ==========================================

  function addQuickLogButton() {
    const workoutScreen = document.getElementById("screen");
    if (!workoutScreen) return;

    if (document.getElementById("quickLogBtn")) return;

    const btn = document.createElement("button");
    btn.id = "quickLogBtn";
    btn.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 20px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #ff6fcb 0%, #a990ff 100%);
      border: none;
      border-radius: 25px;
      color: #fff;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      z-index: 9998;
      box-shadow: 0 4px 15px rgba(255, 111, 203, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.2s;
    `;
    btn.innerHTML = `<span style="font-size: 20px;">⚡</span> Quick Log`;

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "scale(1.05)";
      sounds.click();
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
    });

    btn.addEventListener("click", () => {
      if (root.BarbellDivaQuickLog) {
        root.BarbellDivaQuickLog.showQuickLogModal((setData) => {
          onSetRecorded(setData);
        });
      }
      sounds.pop();
    });

    document.body.appendChild(btn);
    return btn;
  }

  // ==========================================
  // SET COMPLETION - PR Check
  // ==========================================

  function onSetRecorded(setData) {
    // Check for PR
    if (root.BarbellDivaPRCelebrations) {
      const isPR = root.BarbellDivaPRCelebrations.checkAndCelebratePR(
        setData.exerciseName,
        setData.weight,
        setData.reps
      );

      if (isPR) {
        setExpression("celebrating");
        sounds.celebration();
        if (root.BarbellDivaNotifications) {
          root.BarbellDivaNotifications.showPRNotification(
            setData.exerciseName,
            setData.weight,
            setData.reps
          );
        }
        setTimeout(() => setExpression("happy"), 3000);
      } else {
        setExpression("excited");
        sounds.success();
        setTimeout(() => setExpression("happy"), 2000);
      }
    }

    // Record in progress charts
    if (root.BarbellDivaProgressCharts) {
      root.BarbellDivaProgressCharts.recordSet(
        setData.exerciseName,
        setData.weight,
        setData.reps,
        setData.rir
      );
    }

    // Record workout day
    if (root.BarbellDivaConsistencyHeatmap) {
      root.BarbellDivaConsistencyHeatmap.recordWorkoutDay(new Date());
    }

    // Show success toast
    if (root.BarbellDivaUI) {
      root.BarbellDivaUI.showToast("✓ Serie salvata!", "success");
    }

    // Update goals
    if (root.BarbellDivaGoalsStats) {
      const current = root.BarbellDivaGoalsStats.calculateCurrentStreak();
      root.BarbellDivaGoalsStats.updateGoalProgress("streakTarget", current);
    }
  }

  // ==========================================
  // WORKOUT START
  // ==========================================

  function onWorkoutStart() {
    setTimeout(() => {
      setExpression("motivated");
      if (root.BarbellDivaPersonality) {
        root.BarbellDivaPersonality.showDivaMessage({
          type: "sessionStart",
          mood: "energetic"
        });
      }
      setTimeout(() => setExpression("happy"), 3000);
    }, 1000);
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  function init() {
    addRobotStyles();

    // Create Diva Robot
    setTimeout(createDivaRobot, 500);

    // Add Quick Log button
    const observer = new MutationObserver(() => {
      const screen = document.getElementById("screen");
      if (screen && screen.children.length > 0) {
        addQuickLogButton();
      }
    });

    const screen = document.getElementById("screen");
    if (screen) {
      observer.observe(screen, { childList: true });
    }

    // Listen for workout start
    document.addEventListener("workoutStarted", onWorkoutStart);

    // Set periodic expression changes
    setInterval(() => {
      const expressions = ["happy", "thinking", "motivated"];
      const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
      setExpression(randomExpr);
    }, 10000);
  }

  // Add CSS styles
  function addRobotStyles() {
    if (document.getElementById("robot-styles")) return;

    const styles = document.createElement("style");
    styles.id = "robot-styles";
    styles.textContent = `
      @keyframes robotBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      @keyframes divaSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes robotPulse {
        0%, 100% { box-shadow: 0 4px 15px rgba(255, 111, 203, 0.4); }
        50% { box-shadow: 0 4px 25px rgba(255, 111, 203, 0.7); }
      }
      #divaRobot:hover {
        animation: none !important;
      }
      #divaRobotFace {
        animation: robotBounce 2s ease-in-out infinite, robotPulse 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styles);
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose API
  root.BarbellDivaIntegration = Object.freeze({
    createDivaRobot,
    addQuickLogButton,
    onSetRecorded,
    onWorkoutStart,
    setExpression,
    showDivaPopup,
    init
  });
})(typeof window !== "undefined" ? window : globalThis);