/**
 * Consistency Heatmap Module - Barbell Diva
 * Shows a GitHub-style contribution calendar of workout days
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "barbell-diva-workout-days";

  // Load workout days from localStorage
  function loadWorkoutDays() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Save workout days to localStorage
  function saveWorkoutDays(days) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    } catch {
      // Storage full or unavailable
    }
  }

  // Record a workout day
  function recordWorkoutDay(date, intensity = 1) {
    const days = loadWorkoutDays();
    const dateKey = formatDateKey(date);

    if (days[dateKey]) {
      days[dateKey].count += 1;
      days[dateKey].intensity = Math.min(4, days[dateKey].intensity + intensity);
    } else {
      days[dateKey] = {
        date: dateKey,
        count: 1,
        intensity: intensity,
        timestamp: new Date(dateKey).getTime()
      };
    }

    saveWorkoutDays(days);
    return days[dateKey];
  }

  // Format date as YYYY-MM-DD
  function formatDateKey(date) {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  }

  // Get intensity color
  function getIntensityColor(intensity) {
    const colors = [
      "#1a1a2e", // 0 - no workout
      "#2d4a3e", // 1 - light
      "#3d6b4f", // 2 - moderate
      "#4d8c60", // 3 - hard
      "#69e6b0"  // 4 - very hard
    ];
    return colors[Math.min(intensity, 4)] || colors[0];
  }

  // Get intensity label
  function getIntensityLabel(intensity) {
    const labels = [
      "Nessun allenamento",
      "Leggero",
      "Moderato",
      "Intenso",
      "Molto intenso"
    ];
    return labels[Math.min(intensity, 4)] || labels[0];
  }

  // Generate heatmap data for a date range
  function generateHeatmapData(startDate, endDate) {
    const days = loadWorkoutDays();
    const data = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateKey = formatDateKey(current);
      const dayData = days[dateKey] || { date: dateKey, count: 0, intensity: 0 };

      data.push({
        date: dateKey,
        dayOfWeek: current.getDay(),
        weekOfMonth: Math.floor(current.getDate() / 7),
        count: dayData.count,
        intensity: dayData.intensity,
        color: getIntensityColor(dayData.intensity)
      });

      current.setDate(current.getDate() + 1);
    }

    return data;
  }

  // Calculate streak
  function calculateStreak() {
    const days = loadWorkoutDays();
    const today = new Date();
    let streak = 0;
    let current = new Date(today);

    // Check if today has a workout, if not start from yesterday
    const todayKey = formatDateKey(today);
    if (!days[todayKey]) {
      current.setDate(current.getDate() - 1);
    }

    while (true) {
      const dateKey = formatDateKey(current);
      if (days[dateKey]) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // Get total workouts in last 30 days
  function getRecentWorkoutCount(daysCount = 30) {
    const days = loadWorkoutDays();
    const today = new Date();
    let count = 0;

    for (let i = 0; i < daysCount; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = formatDateKey(date);
      if (days[dateKey]) {
        count++;
      }
    }

    return count;
  }

  // Create heatmap container element
  function createHeatmapContainer() {
    const container = document.createElement("div");
    container.className = "consistency-heatmap-container";
    container.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 15px 0;
    `;
    return container;
  }

  // Create heatmap grid
  function createHeatmapGrid(months = 3) {
    const container = createHeatmapContainer();
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);

    const data = generateHeatmapData(startDate, today);

    // Group by weeks
    const weeks = [];
    let currentWeek = [];

    data.forEach((day, index) => {
      if (index === 0) {
        // Pad first week with empty days
        for (let i = 0; i < day.dayOfWeek; i++) {
          currentWeek.push(null);
        }
      }

      currentWeek.push(day);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Create header
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    `;

    const streak = calculateStreak();
    const recentCount = getRecentWorkoutCount(30);

    header.innerHTML = `
      <div>
        <h3 style="color: #fff; margin: 0; font-size: 16px;">
          🔥 Consistenza
        </h3>
        <p style="color: #a990ff; margin: 5px 0 0 0; font-size: 12px;">
          ${streak} giorni consecutivi • ${recentCount} allenamenti negli ultimi 30 giorni
        </p>
      </div>
    `;

    container.appendChild(header);

    // Create grid
    const grid = document.createElement("div");
    grid.style.cssText = `
      display: flex;
      gap: 3px;
      overflow-x: auto;
      padding-bottom: 10px;
    `;

    // Day labels
    const dayLabels = document.createElement("div");
    dayLabels.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-right: 8px;
      padding-top: 18px;
    `;

    ["Lun", "", "Mer", "", "Ven", "", "Sab"].forEach(label => {
      const labelEl = document.createElement("div");
      labelEl.style.cssText = `
        height: 14px;
        font-size: 10px;
        color: #666;
        display: flex;
        align-items: center;
      `;
      labelEl.textContent = label;
      dayLabels.appendChild(labelEl);
    });

    grid.appendChild(dayLabels);

    // Week columns
    weeks.forEach(week => {
      const weekCol = document.createElement("div");
      weekCol.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 3px;
      `;

      for (let i = 0; i < 7; i++) {
        const day = week[i];
        const cell = document.createElement("div");
        cell.style.cssText = `
          width: 14px;
          height: 14px;
          border-radius: 3px;
          background: ${day ? day.color : "#0d0d1a"};
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        `;

        if (day && day.count > 0) {
          cell.title = `${day.date}: ${getIntensityLabel(day.intensity)} (${day.count} allenamenti)`;
          cell.addEventListener("mouseenter", () => {
            cell.style.transform = "scale(1.3)";
            cell.style.boxShadow = "0 0 8px rgba(105, 230, 176, 0.5)";
          });
          cell.addEventListener("mouseleave", () => {
            cell.style.transform = "scale(1)";
            cell.style.boxShadow = "none";
          });
        }

        weekCol.appendChild(cell);
      }

      grid.appendChild(weekCol);
    });

    container.appendChild(grid);

    // Legend
    const legend = document.createElement("div");
    legend.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 15px;
      font-size: 11px;
      color: #888;
    `;

    legend.innerHTML = `
      <span>Meno</span>
      ${[0, 1, 2, 3, 4].map(i => `
        <div style="
          width: 12px;
          height: 12px;
          border-radius: 2px;
          background: ${getIntensityColor(i)};
        "></div>
      `).join("")}
      <span>Più</span>
    `;

    container.appendChild(legend);

    return container;
  }

  // Render heatmap into a target element
  function renderHeatmap(targetElement, months = 3) {
    const heatmap = createHeatmapGrid(months);
    targetElement.innerHTML = "";
    targetElement.appendChild(heatmap);
  }

  // Expose API
  root.BarbellDivaConsistencyHeatmap = Object.freeze({
    recordWorkoutDay,
    loadWorkoutDays,
    generateHeatmapData,
    calculateStreak,
    getRecentWorkoutCount,
    getIntensityColor,
    getIntensityLabel,
    createHeatmapGrid,
    renderHeatmap
  });
})(typeof window !== "undefined" ? window : globalThis);