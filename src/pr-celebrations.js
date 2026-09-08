/**
 * PR Celebrations Module - Barbell Diva
 * Detects personal records and triggers celebration animations
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "barbell-diva-pr-history";

  // Load PR history from localStorage
  function loadPRHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Save PR history to localStorage
  function savePRHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage full or unavailable
    }
  }

  // Get the best weight for an exercise
  function getBestWeight(history, exerciseName) {
    const key = exerciseName.toLowerCase().trim();
    return history[key]?.bestWeight || 0;
  }

  // Check if a new set is a PR
  function isNewPR(exerciseName, weight, reps) {
    const history = loadPRHistory();
    const key = exerciseName.toLowerCase().trim();
    const current = history[key];

    if (!current) return true;

    // PR if weight is higher, or same weight with more reps
    if (weight > current.bestWeight) return true;
    if (weight === current.bestWeight && reps > (current.bestReps || 0)) return true;

    return false;
  }

  // Record a new PR
  function recordPR(exerciseName, weight, reps, date) {
    const history = loadPRHistory();
    const key = exerciseName.toLowerCase().trim();

    history[key] = {
      bestWeight: weight,
      bestReps: reps,
      date: date || new Date().toISOString(),
      exerciseName: exerciseName
    };

    savePRHistory(history);
    return history[key];
  }

  // Create confetti particle
  function createConfettiParticle(colors) {
    const particle = document.createElement("div");
    particle.className = "pr-confetti-particle";
    particle.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? "50%" : "0"};
      pointer-events: none;
      z-index: 10000;
      opacity: 1;
    `;
    return particle;
  }

  // Launch confetti celebration
  function launchConfetti(duration = 3000) {
    const colors = ["#ff6fcb", "#69e6b0", "#a990ff", "#ff6e7d", "#ff9b49", "#d8a4ff"];
    const container = document.createElement("div");
    container.className = "pr-confetti-container";
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
    document.body.appendChild(container);

    const particles = [];
    const particleCount = 150;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = createConfettiParticle(colors);
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = "-10px";
      container.appendChild(particle);
      particles.push(particle);
    }

    // Animate particles
    const startTime = performance.now();
    const gravity = 0.15;
    const velocities = particles.map(() => ({
      x: (Math.random() - 0.5) * 10,
      y: Math.random() * -15 - 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    }));

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      if (elapsed > duration) {
        container.remove();
        return;
      }

      particles.forEach((particle, i) => {
        const vel = velocities[i];
        vel.y += gravity;

        const currentLeft = parseFloat(particle.style.left);
        const currentTop = parseFloat(particle.style.top);

        particle.style.left = (currentLeft + vel.x * 0.1) + "%";
        particle.style.top = (currentTop + vel.y * 0.5) + "px";
        particle.style.transform = `rotate(${vel.rotation + vel.rotationSpeed * elapsed * 0.01}deg)`;
        particle.style.opacity = Math.max(0, 1 - elapsed / duration);
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  // Show PR celebration modal
  function showPRCelebration(exerciseName, weight, reps) {
    // Create celebration overlay
    const overlay = document.createElement("div");
    overlay.className = "pr-celebration-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: pr-fadeIn 0.3s ease-out;
    `;

    // Create celebration card
    const card = document.createElement("div");
    card.className = "pr-celebration-card";
    card.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #ff6fcb;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      animation: pr-bounceIn 0.5s ease-out;
      box-shadow: 0 20px 60px rgba(255, 111, 203, 0.3);
    `;

    // Diva mascot (SVG)
    const divaMascot = `
      <svg viewBox="0 0 100 100" style="width: 120px; height: 120px; animation: pr-dance 0.5s ease-in-out infinite alternate;">
        <circle cx="50" cy="35" r="25" fill="#ff6fcb"/>
        <ellipse cx="50" cy="75" rx="20" ry="25" fill="#a990ff"/>
        <circle cx="40" cy="30" r="4" fill="#fff"/>
        <circle cx="60" cy="30" r="4" fill="#fff"/>
        <path d="M 40 42 Q 50 50 60 42" stroke="#fff" stroke-width="3" fill="none"/>
        <path d="M 25 20 L 35 25" stroke="#ff6fcb" stroke-width="3" stroke-linecap="round"/>
        <path d="M 75 20 L 65 25" stroke="#ff6fcb" stroke-width="3" stroke-linecap="round"/>
        <circle cx="20" cy="15" r="5" fill="#ff9b49"/>
        <circle cx="80" cy="15" r="5" fill="#ff9b49"/>
      </svg>
    `;

    card.innerHTML = `
      <div style="margin-bottom: 20px;">${divaMascot}</div>
      <h2 style="color: #ff6fcb; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">
        🎉 NUOVO PR! 🎉
      </h2>
      <p style="color: #fff; font-size: 18px; margin: 0 0 5px 0;">
        <strong>${exerciseName}</strong>
      </p>
      <p style="color: #69e6b0; font-size: 32px; margin: 10px 0; font-weight: bold;">
        ${weight} kg × ${reps} reps
      </p>
      <p style="color: #a990ff; font-size: 14px; margin: 15px 0 0 0;">
        Lift. Slay. Repeat. 💅
      </p>
      <button id="pr-celebration-close" style="
        margin-top: 25px;
        padding: 12px 30px;
        background: linear-gradient(135deg, #ff6fcb 0%, #a990ff 100%);
        border: none;
        border-radius: 25px;
        color: #fff;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        Continua ad allenarti! 💪
      </button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Add CSS animations
    if (!document.getElementById("pr-celebration-styles")) {
      const styles = document.createElement("style");
      styles.id = "pr-celebration-styles";
      styles.textContent = `
        @keyframes pr-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pr-bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pr-dance {
          0% { transform: rotate(-10deg) translateY(0); }
          100% { transform: rotate(10deg) translateY(-10px); }
        }
        #pr-celebration-close:hover {
          transform: scale(1.05);
        }
      `;
      document.head.appendChild(styles);
    }

    // Close button handler
    const closeBtn = document.getElementById("pr-celebration-close");
    closeBtn.addEventListener("click", () => {
      overlay.style.animation = "pr-fadeIn 0.2s ease-out reverse";
      setTimeout(() => overlay.remove(), 200);
    });

    // Auto close after 8 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.style.animation = "pr-fadeIn 0.2s ease-out reverse";
        setTimeout(() => overlay.remove(), 200);
      }
    }, 8000);
  }

  // Main function to check and celebrate PR
  function checkAndCelebratePR(exerciseName, weight, reps) {
    if (isNewPR(exerciseName, weight, reps)) {
      recordPR(exerciseName, weight, reps);
      launchConfetti();
      showPRCelebration(exerciseName, weight, reps);
      return true;
    }
    return false;
  }

  // Expose API
  root.BarbellDivaPRCelebrations = Object.freeze({
    isNewPR,
    recordPR,
    checkAndCelebratePR,
    getBestWeight,
    loadPRHistory
  });
})(typeof window !== "undefined" ? window : globalThis);