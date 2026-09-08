/**
 * UI Enhancements Module - Barbell Diva
 * Micro-interactions, empty states, and skeleton loading
 */
(function (root) {
  "use strict";

  // ==========================================
  // MICRO-INTERACTIONS (Punto 4)
  // ==========================================

  // Trigger haptic feedback (vibration)
  function triggerHaptic(pattern = "light") {
    if (!navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 30, 50]
    };

    navigator.vibrate(patterns[pattern] || patterns.light);
  }

  // Create animated checkmark
  function showAnimatedCheck(targetElement, options = {}) {
    const {
      color = "#69e6b0",
      size = 60,
      duration = 1500,
      onComplete = null
    } = options;

    const container = document.createElement("div");
    container.className = "animated-check-container";
    container.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
    `;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 52 52");
    svg.style.cssText = `
      animation: checkScale 0.3s ease-out;
    `;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "26");
    circle.setAttribute("cy", "26");
    circle.setAttribute("r", "24");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", color);
    circle.setAttribute("stroke-width", "2");
    circle.style.cssText = `
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      animation: checkCircle 0.6s ease-out forwards;
    `;

    const check = document.createElementNS("http://www.w3.org/2000/svg", "path");
    check.setAttribute("d", "M14 27l7 7 16-16");
    check.setAttribute("fill", "none");
    check.setAttribute("stroke", color);
    check.setAttribute("stroke-width", "3");
    check.setAttribute("stroke-linecap", "round");
    check.style.cssText = `
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: checkMark 0.3s ease-out 0.6s forwards;
    `;

    svg.appendChild(circle);
    svg.appendChild(check);
    container.appendChild(svg);

    targetElement.style.position = "relative";
    targetElement.appendChild(container);

    // Add styles if not present
    addCheckStyles();

    setTimeout(() => {
      container.style.transition = "opacity 0.3s";
      container.style.opacity = "0";
      setTimeout(() => {
        container.remove();
        if (onComplete) onComplete();
      }, 300);
    }, duration);

    // Trigger haptic
    triggerHaptic("success");
  }

  function addCheckStyles() {
    if (document.getElementById("check-animation-styles")) return;

    const styles = document.createElement("style");
    styles.id = "check-animation-styles";
    styles.textContent = `
      @keyframes checkScale {
        0% { transform: scale(0); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      @keyframes checkCircle {
        to { stroke-dashoffset: 0; }
      }
      @keyframes checkMark {
        to { stroke-dashoffset: 0; }
      }
    `;
    document.head.appendChild(styles);
  }

  // Session progress bar
  function createSessionProgress(containerElement, totalSets) {
    const progressContainer = document.createElement("div");
    progressContainer.className = "session-progress";
    progressContainer.style.cssText = `
      margin: 15px 0;
      padding: 0 5px;
    `;

    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
      height: 6px;
      background: #1a1a2e;
      border-radius: 3px;
      overflow: hidden;
    `;

    const progressFill = document.createElement("div");
    progressFill.className = "session-progress-fill";
    progressFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #ff6fcb 0%, #69e6b0 100%);
      border-radius: 3px;
      transition: width 0.5s ease-out;
    `;

    progressBar.appendChild(progressFill);

    const progressText = document.createElement("div");
    progressText.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
      font-size: 11px;
      color: #666;
    `;
    progressText.innerHTML = `
      <span>0/${totalSets} serie</span>
      <span class="progress-percent">0%</span>
    `;

    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(progressText);
    containerElement.appendChild(progressContainer);

    return {
      update(completedSets) {
        const percent = Math.round((completedSets / totalSets) * 100);
        progressFill.style.width = percent + "%";
        progressText.querySelector("span:first-child").textContent = `${completedSets}/${totalSets} serie`;
        progressText.querySelector(".progress-percent").textContent = `${percent}%`;

        if (percent === 100) {
          progressFill.style.background = "linear-gradient(90deg, #69e6b0 0%, #4d8c60 100%)";
          triggerHaptic("success");
        }
      }
    };
  }

  // Pulse animation on element
  function pulseElement(element, color = "#ff6fcb") {
    element.style.transition = "box-shadow 0.3s";
    element.style.boxShadow = `0 0 0 0 ${color}`;
    setTimeout(() => {
      element.style.boxShadow = `0 0 0 15px transparent`;
    }, 100);
    setTimeout(() => {
      element.style.boxShadow = "none";
    }, 400);
  }

  // Confetti burst for celebrations
  function miniConfettiBurst(x, y) {
    const colors = ["#ff6fcb", "#69e6b0", "#a990ff", "#ff9b49"];
    const particles = 12;

    for (let i = 0; i < particles; i++) {
      const particle = document.createElement("div");
      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 8px;
        height: 8px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(particle);

      const angle = (i / particles) * Math.PI * 2;
      const velocity = 50 + Math.random() * 50;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      let posX = 0;
      let posY = 0;
      let opacity = 1;

      function animate() {
        posX += vx * 0.02;
        posY += vy * 0.02 + 2;
        opacity -= 0.02;

        particle.style.transform = `translate(${posX}px, ${posY}px)`;
        particle.style.opacity = opacity;

        if (opacity > 0) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      }

      requestAnimationFrame(animate);
    }
  }

  // ==========================================
  // EMPTY STATES (Punto 5)
  // ==========================================

  // Create empty state placeholder
  function createEmptyState(containerElement, options = {}) {
    const {
      icon = "🏋️",
      title = "Nessun dato",
      message = "Inizia ad allenarti per vedere i tuoi progressi!",
      actionText = null,
      actionCallback = null
    } = options;

    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      animation: fadeInUp 0.4s ease-out;
    `;

    emptyState.innerHTML = `
      <div class="empty-state-icon" style="
        font-size: 48px;
        margin-bottom: 15px;
        animation: float 3s ease-in-out infinite;
      ">${icon}</div>
      <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 16px;">${title}</h3>
      <p style="color: #666; margin: 0; font-size: 13px; max-width: 250px;">${message}</p>
      ${actionText ? `
        <button class="empty-state-action" style="
          margin-top: 20px;
          padding: 10px 24px;
          background: linear-gradient(135deg, #ff6fcb 0%, #a990ff 100%);
          border: none;
          border-radius: 20px;
          color: #fff;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        ">${actionText}</button>
      ` : ""}
    `;

    containerElement.innerHTML = "";
    containerElement.appendChild(emptyState);

    if (actionCallback) {
      emptyState.querySelector(".empty-state-action").addEventListener("click", actionCallback);
    }

    addEmptyStateStyles();
    return emptyState;
  }

  function addEmptyStateStyles() {
    if (document.getElementById("empty-state-styles")) return;

    const styles = document.createElement("style");
    styles.id = "empty-state-styles";
    styles.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .empty-state-action:hover {
        transform: scale(1.05) !important;
      }
    `;
    document.head.appendChild(styles);
  }

  // ==========================================
  // SKELETON LOADING (Punto 5)
  // ==========================================

  // Create skeleton placeholder
  function createSkeletonLoader(containerElement, type = "card") {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-loader";
    skeleton.dataset.skeletonType = type;

    addSkeletonStyles();

    switch (type) {
      case "card":
        skeleton.innerHTML = createCardSkeleton();
        break;
      case "list":
        skeleton.innerHTML = createListSkeleton();
        break;
      case "chart":
        skeleton.innerHTML = createChartSkeleton();
        break;
      case "stats":
        skeleton.innerHTML = createStatsSkeleton();
        break;
      default:
        skeleton.innerHTML = createCardSkeleton();
    }

    containerElement.innerHTML = "";
    containerElement.appendChild(skeleton);
    return skeleton;
  }

  function createCardSkeleton() {
    return `
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 15px; margin: 10px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div>
            <div class="skeleton-line" style="width: 120px; height: 16px; margin-bottom: 8px;"></div>
            <div class="skeleton-line" style="width: 80px; height: 12px;"></div>
          </div>
          <div class="skeleton-line" style="width: 60px; height: 24px;"></div>
        </div>
        <div style="display: flex; gap: 15px;">
          <div class="skeleton-line" style="flex: 1; height: 40px;"></div>
          <div class="skeleton-line" style="flex: 1; height: 40px;"></div>
        </div>
      </div>
    `;
  }

  function createListSkeleton() {
    return `
      <div style="padding: 10px 0;">
        ${Array(4).fill().map(() => `
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0;">
            <div class="skeleton-circle" style="width: 40px; height: 40px;"></div>
            <div style="flex: 1;">
              <div class="skeleton-line" style="width: 60%; height: 14px; margin-bottom: 6px;"></div>
              <div class="skeleton-line" style="width: 40%; height: 10px;"></div>
            </div>
            <div class="skeleton-line" style="width: 50px; height: 14px;"></div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function createChartSkeleton() {
    return `
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 20px;">
        <div class="skeleton-line" style="width: 100px; height: 16px; margin-bottom: 15px;"></div>
        <div style="display: flex; align-items: flex-end; gap: 4px; height: 100px;">
          ${Array(12).fill().map(() => `
            <div class="skeleton-bar" style="
              flex: 1;
              height: ${20 + Math.random() * 60}%;
              animation-delay: ${Math.random() * 2}s;
            "></div>
          `).join("")}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
          ${Array(4).fill().map(() => `
            <div class="skeleton-line" style="width: 40px; height: 10px;"></div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function createStatsSkeleton() {
    return `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
        ${Array(3).fill().map(() => `
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 10px; padding: 15px; text-align: center;">
            <div class="skeleton-circle" style="width: 30px; height: 30px; margin: 0 auto 10px;"></div>
            <div class="skeleton-line" style="width: 50px; height: 20px; margin: 0 auto 5px;"></div>
            <div class="skeleton-line" style="width: 40px; height: 10px; margin: 0 auto;"></div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function addSkeletonStyles() {
    if (document.getElementById("skeleton-styles")) return;

    const styles = document.createElement("style");
    styles.id = "skeleton-styles";
    styles.textContent = `
      .skeleton-line,
      .skeleton-circle,
      .skeleton-bar {
        background: linear-gradient(90deg, #1a1a2e 25%, #2a2a4a 50%, #1a1a2e 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        animation: skeletonShimmer 1.5s infinite;
      }
      .skeleton-circle {
        border-radius: 50%;
      }
      .skeleton-bar {
        border-radius: 2px 2px 0 0;
      }
      @keyframes skeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(styles);
  }

  // Remove skeleton and show content
  function replaceSkeleton(skeletonElement, contentElement) {
    skeletonElement.style.transition = "opacity 0.3s";
    skeletonElement.style.opacity = "0";
    setTimeout(() => {
      skeletonElement.remove();
      contentElement.style.opacity = "0";
      contentElement.style.transition = "opacity 0.3s";
      requestAnimationFrame(() => {
        contentElement.style.opacity = "1";
      });
    }, 300);
  }

  // Loading spinner
  function createLoadingSpinner(size = 30, color = "#ff6fcb") {
    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    spinner.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border: 3px solid #1a1a2e;
      border-top-color: ${color};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    `;

    addSpinnerStyles();
    return spinner;
  }

  function addSpinnerStyles() {
    if (document.getElementById("spinner-styles")) return;

    const styles = document.createElement("style");
    styles.id = "spinner-styles";
    styles.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styles);
  }

  // Toast notification
  function showToast(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = "ui-toast";

    const colors = {
      info: "#a990ff",
      success: "#69e6b0",
      warning: "#ff9b49",
      error: "#ff6e7d"
    };

    const icons = {
      info: "ℹ️",
      success: "✓",
      warning: "⚠️",
      error: "✕"
    };

    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      padding: 12px 24px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-left: 3px solid ${colors[type]};
      border-radius: 8px;
      color: #fff;
      font-size: 13px;
      z-index: 10000;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    toast.innerHTML = `
      <span>${icons[type]}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = "translateX(-50%) translateY(0)";
    });

    // Remove after duration
    setTimeout(() => {
      toast.style.transform = "translateX(-50%) translateY(100px)";
      setTimeout(() => toast.remove(), 300);
    }, duration);

    triggerHaptic("light");
  }

  // Button press effect
  function addButtonPressEffect(button) {
    button.addEventListener("mousedown", () => {
      button.style.transform = "scale(0.95)";
      triggerHaptic("light");
    });

    button.addEventListener("mouseup", () => {
      button.style.transform = "scale(1)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
    });
  }

  // ==========================================
  // EXPORT API
  // ==========================================

  root.BarbellDivaUI = Object.freeze({
    // Micro-interactions
    triggerHaptic,
    showAnimatedCheck,
    createSessionProgress,
    pulseElement,
    miniConfettiBurst,

    // Empty states
    createEmptyState,

    // Skeleton loading
    createSkeletonLoader,
    replaceSkeleton,
    createLoadingSpinner,

    // Notifications
    showToast,

    // Effects
    addButtonPressEffect
  });
})(typeof window !== "undefined" ? window : globalThis);