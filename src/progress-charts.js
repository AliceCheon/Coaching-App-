/**
 * Progress Charts Module - Barbell Diva
 * Sparklines, e1RM estimates, and RIR trends
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "barbell-diva-progress-data";

  // Load progress data from localStorage
  function loadProgressData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Save progress data to localStorage
  function saveProgressData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable
    }
  }

  // Calculate estimated 1RM using Epley formula
  function calculateE1RM(weight, reps) {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  }

  // Calculate estimated 1RM using Brzycki formula
  function calculateE1RMBrzycki(weight, reps) {
    if (reps === 1) return weight;
    return weight * (36 / (37 - reps));
  }

  // Record a set for progress tracking
  function recordSet(exerciseName, weight, reps, rir, date) {
    const data = loadProgressData();
    const key = exerciseName.toLowerCase().trim();
    const dateKey = date || new Date().toISOString().split("T")[0];

    if (!data[key]) {
      data[key] = {
        exerciseName: exerciseName,
        sets: []
      };
    }

    const set = {
      date: dateKey,
      weight: weight,
      reps: reps,
      rir: rir || null,
      e1rm: calculateE1RM(weight, reps),
      timestamp: new Date(dateKey).getTime()
    };

    data[key].sets.push(set);
    data[key].sets.sort((a, b) => a.timestamp - b.timestamp);

    saveProgressData(data);
    return set;
  }

  // Get progress data for an exercise
  function getExerciseProgress(exerciseName) {
    const data = loadProgressData();
    const key = exerciseName.toLowerCase().trim();
    return data[key] || { exerciseName, sets: [] };
  }

  // Get e1RM trend for an exercise
  function getE1RMTrend(exerciseName, days = 90) {
    const progress = getExerciseProgress(exerciseName);
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    return progress.sets
      .filter(s => s.timestamp >= cutoff)
      .map(s => ({
        date: s.date,
        e1rm: s.e1rm,
        weight: s.weight,
        reps: s.reps
      }));
  }

  // Get RIR trend for an exercise
  function getRIRTrend(exerciseName, days = 90) {
    const progress = getExerciseProgress(exerciseName);
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    return progress.sets
      .filter(s => s.timestamp >= cutoff && s.rir !== null)
      .map(s => ({
        date: s.date,
        rir: s.rir
      }));
  }

  // Get best e1RM for an exercise
  function getBestE1RM(exerciseName) {
    const progress = getExerciseProgress(exerciseName);
    if (progress.sets.length === 0) return null;

    return progress.sets.reduce((best, set) => {
      if (!best || set.e1rm > best.e1rm) return set;
      return best;
    }, null);
  }

  // Get volume trend (total weight lifted per session)
  function getVolumeTrend(exerciseName, days = 90) {
    const progress = getExerciseProgress(exerciseName);
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    const sessions = {};
    progress.sets
      .filter(s => s.timestamp >= cutoff)
      .forEach(set => {
        if (!sessions[set.date]) {
          sessions[set.date] = { date: set.date, volume: 0, sets: 0 };
        }
        sessions[set.date].volume += set.weight * set.reps;
        sessions[set.date].sets += 1;
      });

    return Object.values(sessions).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Create sparkline SVG
  function createSparkline(data, options = {}) {
    const {
      width = 120,
      height = 30,
      color = "#69e6b0",
      fillColor = "rgba(105, 230, 176, 0.2)",
      strokeWidth = 2
    } = options;

    if (data.length === 0) {
      return `<svg width="${width}" height="${height}" class="sparkline-empty">
        <text x="50%" y="50%" text-anchor="middle" fill="#666" font-size="10">No data</text>
      </svg>`;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    });

    const areaPoints = [
      `0,${height}`,
      ...points,
      `${width},${height}`
    ].join(" ");

    return `<svg width="${width}" height="${height}" class="sparkline">
      <polygon points="${areaPoints}" fill="${fillColor}" />
      <polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${points[points.length - 1].split(",")[0]}" cy="${points[points.length - 1].split(",")[1]}" r="3" fill="${color}" />
    </svg>`;
  }

  // Create progress card for an exercise
  function createProgressCard(exerciseName) {
    const card = document.createElement("div");
    card.className = "progress-card";
    card.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 15px;
      margin: 10px 0;
    `;

    const progress = getExerciseProgress(exerciseName);
    const e1rmTrend = getE1RMTrend(exerciseName, 90);
    const bestE1RM = getBestE1RM(exerciseName);
    const volumeTrend = getVolumeTrend(exerciseName, 90);

    const latestE1RM = e1rmTrend.length > 0 ? e1rmTrend[e1rmTrend.length - 1].e1rm : 0;
    const previousE1RM = e1rmTrend.length > 1 ? e1rmTrend[e1rmTrend.length - 2].e1rm : latestE1RM;
    const e1rmChange = latestE1RM - previousE1RM;
    const e1rmChangePercent = previousE1RM > 0 ? ((e1rmChange / previousE1RM) * 100).toFixed(1) : 0;

    const changeColor = e1rmChange >= 0 ? "#69e6b0" : "#ff6e7d";
    const changeIcon = e1rmChange >= 0 ? "↑" : "↓";

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div>
          <h4 style="color: #fff; margin: 0; font-size: 14px;">${exerciseName}</h4>
          <p style="color: #888; margin: 2px 0 0 0; font-size: 11px;">
            ${progress.sets.length} serie totali
          </p>
        </div>
        <div style="text-align: right;">
          <div style="color: ${changeColor}; font-size: 18px; font-weight: bold;">
            ${changeIcon} ${Math.abs(e1rmChangePercent)}%
          </div>
          <div style="color: #666; font-size: 10px;">e1RM 90gg</div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
        <div style="flex: 1;">
          <div style="color: #666; font-size: 10px; margin-bottom: 3px;">e1RM Trend</div>
          ${createSparkline(e1rmTrend.map(d => d.e1rm), { color: "#69e6b0", fillColor: "rgba(105, 230, 176, 0.2)" })}
        </div>
        <div style="flex: 1;">
          <div style="color: #666; font-size: 10px; margin-bottom: 3px;">Volume Trend</div>
          ${createSparkline(volumeTrend.map(d => d.volume), { color: "#a990ff", fillColor: "rgba(169, 144, 255, 0.2)" })}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 11px;">
        <div>
          <span style="color: #666;">Attuale:</span>
          <span style="color: #fff; font-weight: bold;">${latestE1RM.toFixed(1)} kg</span>
        </div>
        <div>
          <span style="color: #666;">Best:</span>
          <span style="color: #ff6fcb; font-weight: bold;">${bestE1RM ? bestE1RM.e1rm.toFixed(1) : 0} kg</span>
        </div>
        <div>
          <span style="color: #666;">Ultimo:</span>
          <span style="color: #fff;">${progress.sets.length > 0 ? progress.sets[progress.sets.length - 1].weight : 0} kg × ${progress.sets.length > 0 ? progress.sets[progress.sets.length - 1].reps : 0}</span>
        </div>
      </div>
    `;

    return card;
  }

  // Create mini stats widget
  function createMiniStatsWidget() {
    const widget = document.createElement("div");
    widget.className = "mini-stats-widget";
    widget.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 15px 0;
    `;

    const data = loadProgressData();
    const exercises = Object.keys(data);

    // Calculate overall stats
    let totalSets = 0;
    let totalVolume = 0;
    let bestExercise = null;
    let bestExerciseE1RM = 0;

    exercises.forEach(key => {
      const exercise = data[key];
      exercise.sets.forEach(set => {
        totalSets++;
        totalVolume += set.weight * set.reps;
      });

      const best = getBestE1RM(exercise.exerciseName);
      if (best && best.e1rm > bestExerciseE1RM) {
        bestExerciseE1RM = best.e1rm;
        bestExercise = exercise.exerciseName;
      }
    });

    const stats = [
      { label: "Esercizi", value: exercises.length, icon: "🏋️", color: "#ff6fcb" },
      { label: "Serie Totali", value: totalSets, icon: "📊", color: "#69e6b0" },
      { label: "Miglior e1RM", value: bestExerciseE1RM.toFixed(0) + " kg", icon: "👑", color: "#a990ff" }
    ];

    stats.forEach(stat => {
      const statCard = document.createElement("div");
      statCard.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 10px;
        padding: 12px;
        text-align: center;
        border-top: 2px solid ${stat.color};
      `;
      statCard.innerHTML = `
        <div style="font-size: 20px; margin-bottom: 5px;">${stat.icon}</div>
        <div style="color: ${stat.color}; font-size: 18px; font-weight: bold;">${stat.value}</div>
        <div style="color: #666; font-size: 10px;">${stat.label}</div>
      `;
      widget.appendChild(statCard);
    });

    return widget;
  }

  // Expose API
  root.BarbellDivaProgressCharts = Object.freeze({
    calculateE1RM,
    calculateE1RMBrzycki,
    recordSet,
    getExerciseProgress,
    getE1RMTrend,
    getRIRTrend,
    getBestE1RM,
    getVolumeTrend,
    createSparkline,
    createProgressCard,
    createMiniStatsWidget,
    loadProgressData
  });
})(typeof window !== "undefined" ? window : globalThis);