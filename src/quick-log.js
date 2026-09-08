/**
 * Quick Log Module - Barbell Diva
 * Record sets in 2-3 taps with pre-filled data from last session
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "barbell-diva-quick-log-history";

  // Load quick log history from localStorage
  function loadHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Save quick log history to localStorage
  function saveHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage full or unavailable
    }
  }

  // Get last set data for an exercise
  function getLastSet(exerciseName) {
    const history = loadHistory();
    const key = exerciseName.toLowerCase().trim();
    return history[key] || null;
  }

  // Record a quick set
  function recordQuickSet(exerciseName, weight, reps, rir, notes) {
    const history = loadHistory();
    const key = exerciseName.toLowerCase().trim();
    const now = new Date();

    const setData = {
      exerciseName: exerciseName,
      weight: weight,
      reps: reps,
      rir: rir || null,
      notes: notes || "",
      timestamp: now.toISOString(),
      date: now.toISOString().split("T")[0]
    };

    // Save as last set for this exercise
    history[key] = setData;

    // Also append to history array
    if (!history[key + "_history"]) {
      history[key + "_history"] = [];
    }
    history[key + "_history"].push(setData);

    // Keep only last 50 sets per exercise
    if (history[key + "_history"].length > 50) {
      history[key + "_history"] = history[key + "_history"].slice(-50);
    }

    saveHistory(history);
    return setData;
  }

  // Get recent exercises (last 10 unique)
  function getRecentExercises() {
    const history = loadHistory();
    const exercises = [];

    Object.keys(history).forEach(key => {
      if (!key.endsWith("_history") && history[key].exerciseName) {
        exercises.push({
          name: history[key].exerciseName,
          lastUsed: history[key].timestamp
        });
      }
    });

    return exercises
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 10);
  }

  // Create quick log button
  function createQuickLogButton(targetElement, onSetRecorded) {
    const button = document.createElement("button");
    button.className = "quick-log-button";
    button.innerHTML = `
      <span style="font-size: 20px;">⚡</span>
      <span>Quick Log</span>
    `;
    button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #ff6fcb 0%, #a990ff 100%);
      border: none;
      border-radius: 25px;
      color: #fff;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(255, 111, 203, 0.3);
    `;

    button.addEventListener("mouseenter", () => {
      button.style.transform = "scale(1.05)";
      button.style.boxShadow = "0 6px 20px rgba(255, 111, 203, 0.5)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
      button.style.boxShadow = "0 4px 15px rgba(255, 111, 203, 0.3)";
    });

    button.addEventListener("click", () => {
      showQuickLogModal(onSetRecorded);
    });

    targetElement.appendChild(button);
    return button;
  }

  // Show quick log modal
  function showQuickLogModal(onSetRecorded) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "quick-log-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 10000;
      animation: quickLogFadeIn 0.2s ease-out;
    `;

    // Create modal
    const modal = document.createElement("div");
    modal.className = "quick-log-modal";
    modal.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 20px 20px 0 0;
      padding: 25px;
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      animation: quickLogSlideUp 0.3s ease-out;
    `;

    // Get recent exercises for quick select
    const recentExercises = getRecentExercises();

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="color: #fff; margin: 0; font-size: 18px;">⚡ Quick Log</h3>
        <button id="quick-log-close" style="
          background: none;
          border: none;
          color: #666;
          font-size: 24px;
          cursor: pointer;
        ">×</button>
      </div>

      <div id="quick-log-exercise-select" style="margin-bottom: 20px;">
        <label style="color: #888; font-size: 12px; display: block; margin-bottom: 8px;">Esercizio</label>
        <input type="text" id="quick-log-exercise-input" placeholder="Cerca o seleziona..." style="
          width: 100%;
          padding: 12px 15px;
          background: #0d0d1a;
          border: 1px solid #333;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          box-sizing: border-box;
        ">
        ${recentExercises.length > 0 ? `
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
            ${recentExercises.slice(0, 5).map(ex => `
              <button class="quick-log-recent-btn" data-exercise="${ex.name}" style="
                padding: 6px 12px;
                background: #2a2a4a;
                border: 1px solid #444;
                border-radius: 15px;
                color: #a990ff;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s;
              ">${ex.name}</button>
            `).join("")}
          </div>
        ` : ""}
      </div>

      <div id="quick-log-set-inputs" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div>
            <label style="color: #888; font-size: 12px; display: block; margin-bottom: 8px;">Peso (kg)</label>
            <input type="number" id="quick-log-weight" step="0.5" style="
              width: 100%;
              padding: 12px;
              background: #0d0d1a;
              border: 1px solid #333;
              border-radius: 10px;
              color: #fff;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              box-sizing: border-box;
            ">
          </div>
          <div>
            <label style="color: #888; font-size: 12px; display: block; margin-bottom: 8px;">Reps</label>
            <input type="number" id="quick-log-reps" style="
              width: 100%;
              padding: 12px;
              background: #0d0d1a;
              border: 1px solid #333;
              border-radius: 10px;
              color: #fff;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              box-sizing: border-box;
            ">
          </div>
          <div>
            <label style="color: #888; font-size: 12px; display: block; margin-bottom: 8px;">RIR</label>
            <input type="number" id="quick-log-rir" min="0" max="10" style="
              width: 100%;
              padding: 12px;
              background: #0d0d1a;
              border: 1px solid #333;
              border-radius: 10px;
              color: #fff;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              box-sizing: border-box;
            ">
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="color: #888; font-size: 12px; display: block; margin-bottom: 8px;">Note (opzionale)</label>
          <input type="text" id="quick-log-notes" placeholder="Es. buona sensazione..." style="
            width: 100%;
            padding: 10px 15px;
            background: #0d0d1a;
            border: 1px solid #333;
            border-radius: 10px;
            color: #fff;
            font-size: 13px;
            box-sizing: border-box;
          ">
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="quick-log-save" style="
            flex: 1;
            padding: 15px;
            background: linear-gradient(135deg, #69e6b0 0%, #4d8c60 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
          ">✓ Salva Serie</button>
          <button id="quick-log-save-another" style="
            flex: 1;
            padding: 15px;
            background: linear-gradient(135deg, #a990ff 0%, #7c5cff 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
          ">+ Altra Serie</button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add styles
    if (!document.getElementById("quick-log-styles")) {
      const styles = document.createElement("style");
      styles.id = "quick-log-styles";
      styles.textContent = `
        @keyframes quickLogFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes quickLogSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .quick-log-recent-btn:hover {
          background: #3a3a5a !important;
          border-color: #69e6b0 !important;
        }
        #quick-log-save:hover, #quick-log-save-another:hover {
          transform: scale(1.02);
        }
      `;
      document.head.appendChild(styles);
    }

    // Event handlers
    const closeBtn = document.getElementById("quick-log-close");
    const exerciseInput = document.getElementById("quick-log-exercise-input");
    const setInputs = document.getElementById("quick-log-set-inputs");
    const weightInput = document.getElementById("quick-log-weight");
    const repsInput = document.getElementById("quick-log-reps");
    const rirInput = document.getElementById("quick-log-rir");
    const notesInput = document.getElementById("quick-log-notes");
    const saveBtn = document.getElementById("quick-log-save");
    const saveAnotherBtn = document.getElementById("quick-log-save-another");

    // Close modal
    closeBtn.addEventListener("click", () => {
      overlay.remove();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Recent exercise buttons
    const recentBtns = modal.querySelectorAll(".quick-log-recent-btn");
    recentBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const exerciseName = btn.dataset.exercise;
        selectExercise(exerciseName);
      });
    });

    // Exercise input handler
    exerciseInput.addEventListener("input", () => {
      if (exerciseInput.value.trim().length > 0) {
        setInputs.style.display = "block";
        const lastSet = getLastSet(exerciseInput.value);
        if (lastSet) {
          weightInput.value = lastSet.weight;
          repsInput.value = lastSet.reps;
          rirInput.value = lastSet.rir || "";
          notesInput.focus();
        } else {
          weightInput.focus();
        }
      } else {
        setInputs.style.display = "none";
      }
    });

    // Save set
    function saveSet(continueEditing) {
      const exerciseName = exerciseInput.value.trim();
      const weight = parseFloat(weightInput.value);
      const reps = parseInt(repsInput.value);
      const rir = rirInput.value ? parseInt(rirInput.value) : null;
      const notes = notesInput.value.trim();

      if (!exerciseName || !weight || !reps) {
        showValidationError();
        return;
      }

      // Record the set
      const setData = recordQuickSet(exerciseName, weight, reps, rir, notes);

      // Trigger callbacks
      if (onSetRecorded) {
        onSetRecorded(setData);
      }

      // Check for PR
      if (root.BarbellDivaPRCelebrations) {
        root.BarbellDivaPRCelebrations.checkAndCelebratePR(exerciseName, weight, reps);
      }

      // Record in progress charts
      if (root.BarbellDivaProgressCharts) {
        root.BarbellDivaProgressCharts.recordSet(exerciseName, weight, reps, rir);
      }

      // Record workout day
      if (root.BarbellDivaConsistencyHeatmap) {
        root.BarbellDivaConsistencyHeatmap.recordWorkoutDay(new Date(), calculateIntensity(weight, reps));
      }

      if (continueEditing) {
        // Clear for next set
        repsInput.value = "";
        rirInput.value = "";
        notesInput.value = "";
        repsInput.focus();
      } else {
        overlay.remove();
      }

      // Show success feedback
      showSuccessFeedback();
    }

    saveBtn.addEventListener("click", () => saveSet(false));
    saveAnotherBtn.addEventListener("click", () => saveSet(true));

    // Helper functions
    function selectExercise(name) {
      exerciseInput.value = name;
      setInputs.style.display = "block";
      const lastSet = getLastSet(name);
      if (lastSet) {
        weightInput.value = lastSet.weight;
        repsInput.value = lastSet.reps;
        rirInput.value = lastSet.rir || "";
        notesInput.focus();
      } else {
        weightInput.focus();
      }
    }

    function calculateIntensity(weight, reps) {
      const volume = weight * reps;
      if (volume > 1000) return 4;
      if (volume > 500) return 3;
      if (volume > 200) return 2;
      return 1;
    }

    function showValidationError() {
      if (!exerciseInput.value.trim()) {
        exerciseInput.style.borderColor = "#ff6e7d";
        setTimeout(() => exerciseInput.style.borderColor = "#333", 2000);
      }
      if (!weightInput.value) {
        weightInput.style.borderColor = "#ff6e7d";
        setTimeout(() => weightInput.style.borderColor = "#333", 2000);
      }
      if (!repsInput.value) {
        repsInput.style.borderColor = "#ff6e7d";
        setTimeout(() => repsInput.style.borderColor = "#333", 2000);
      }
    }

    function showSuccessFeedback() {
      const feedback = document.createElement("div");
      feedback.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: linear-gradient(135deg, #69e6b0 0%, #4d8c60 100%);
        border-radius: 25px;
        color: #fff;
        font-weight: bold;
        z-index: 10001;
        animation: quickLogFadeIn 0.3s ease-out;
      `;
      feedback.textContent = "✓ Serie salvata!";
      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 2000);
    }

    // Focus exercise input
    exerciseInput.focus();
  }

  // Expose API
  root.BarbellDivaQuickLog = Object.freeze({
    recordQuickSet,
    getLastSet,
    getRecentExercises,
    createQuickLogButton,
    showQuickLogModal,
    loadHistory
  });
})(typeof window !== "undefined" ? window : globalThis);