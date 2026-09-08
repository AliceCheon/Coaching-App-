/**
 * App Integration Module - Barbell Diva
 * Integra tutti i moduli nell'app principale
 */
(function (root) {
  "use strict";

  // ==========================================
  // DIVA BOT - Mascotte nell'angolo
  // ==========================================

  // Create persistent Diva bot
  function createDivaBot() {
    const bot = document.createElement("div");
    bot.id = "divaBot";
    bot.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #ff6fcb 0%, #a990ff 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      z-index: 9998;
      box-shadow: 0 4px 15px rgba(255, 111, 203, 0.4);
      transition: transform 0.3s, box-shadow 0.3s;
      animation: divaBounce 2s ease-in-out infinite;
    `;
    bot.textContent = "👑";
    bot.title = "Diva - Clicca per consigli!";

    bot.addEventListener("mouseenter", () => {
      bot.style.transform = "scale(1.1)";
      bot.style.boxShadow = "0 6px 20px rgba(255, 111, 203, 0.6)";
    });

    bot.addEventListener("mouseleave", () => {
      bot.style.transform = "scale(1)";
      bot.style.boxShadow = "0 4px 15px rgba(255, 111, 203, 0.4)";
    });

    bot.addEventListener("click", () => {
      showDivaPopup();
    });

    document.body.appendChild(bot);
    return bot;
  }

  // Show Diva popup message
  function showDivaPopup() {
    const messages = [
      "Ce la stai facendo benissimo! 💪",
      "Diva è orgogliosa di te! 💅",
      "Non mollare, sei a metà strada! 🎯",
      "Ogni ripetizione conta! ✨",
      "Sei più forte di quanto pensi! 🔥",
      "Ricorda: tecnica prima del peso! 🎯",
      "Bevi acqua! I muscoli hanno sete! 💧",
      "Hai fatto il warmup? 🌡️"
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];

    // Remove existing popup
    const existing = document.querySelector(".diva-popup");
    if (existing) existing.remove();

    const popup = document.createElement("div");
    popup.className = "diva-popup";
    popup.style.cssText = `
      position: fixed;
      bottom: 90px;
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
        <span style="font-size: 24px;">👑</span>
        <span style="color: #ff6fcb; font-weight: bold;">DIVA</span>
      </div>
      <div>${message}</div>
    `;

    document.body.appendChild(popup);

    // Auto remove after 4 seconds
    setTimeout(() => {
      if (popup.parentNode) {
        popup.style.animation = "divaSlideUp 0.3s ease-out reverse";
        setTimeout(() => popup.remove(), 300);
      }
    }, 4000);
  }

  // ==========================================
  // QUICK LOG BUTTON
  // ==========================================

  // Add Quick Log button to workout screen
  function addQuickLogButton() {
    const workoutScreen = document.getElementById("screen");
    if (!workoutScreen) return;

    // Check if already added
    if (document.getElementById("quickLogBtn")) return;

    const btn = document.createElement("button");
    btn.id = "quickLogBtn";
    btn.style.cssText = `
      position: fixed;
      bottom: 90px;
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
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
    });

    btn.addEventListener("click", () => {
      if (root.BarbellDivaQuickLog) {
        root.BarbellDivaQuickLog.showQuickLogModal((setData) => {
          // Callback after set is recorded
          onSetRecorded(setData);
        });
      }
    });

    document.body.appendChild(btn);
    return btn;
  }

  // ==========================================
  // SET COMPLETION - PR Check
  // ==========================================

  // Handle set completion
  function onSetRecorded(setData) {
    // Check for PR
    if (root.BarbellDivaPRCelebrations) {
      const isPR = root.BarbellDivaPRCelebrations.checkAndCelebratePR(
        setData.exerciseName,
        setData.weight,
        setData.reps
      );

      if (isPR) {
        // Show notification
        if (root.BarbellDivaNotifications) {
          root.BarbellDivaNotifications.showPRNotification(
            setData.exerciseName,
            setData.weight,
            setData.reps
          );
        }
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
  // WORKOUT START - Show Diva message
  // ==========================================

  // Show workout start message
  function onWorkoutStart() {
    setTimeout(() => {
      if (root.BarbellDivaPersonality) {
        root.BarbellDivaPersonality.showDivaMessage({
          type: "sessionStart",
          mood: "energetic"
        });
      }
    }, 1000);
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  // Initialize all integrations
  function init() {
    // Add CSS styles
    addIntegrationStyles();

    // Create Diva bot
    setTimeout(createDivaBot, 500);

    // Add Quick Log button when workout screen is visible
    const observer = new MutationObserver((mutations) => {
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

    // Add event delegation for set completion
    document.addEventListener("click", (e) => {
      const setBtn = e.target.closest("[data-complete-set]");
      if (setBtn) {
        const exerciseName = setBtn.dataset.exercise || "Esercizio";
        const weight = parseFloat(setBtn.dataset.weight) || 0;
        const reps = parseInt(setBtn.dataset.reps) || 0;

        onSetRecorded({
          exerciseName,
          weight,
          reps,
          rir: null
        });
      }
    });
  }

  // Add CSS styles
  function addIntegrationStyles() {
    if (document.getElementById("integration-styles")) return;

    const styles = document.createElement("style");
    styles.id = "integration-styles";
    styles.textContent = `
      @keyframes divaBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      @keyframes divaSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #divaBot:hover {
        animation: none !important;
      }
      #quickLogBtn:hover {
        animation: none !important;
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
    createDivaBot,
    addQuickLogButton,
    onSetRecorded,
    onWorkoutStart,
    init
  });
})(typeof window !== "undefined" ? window : globalThis);