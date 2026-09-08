/**
 * Goals & Advanced Stats Module - Barbell Diva
 * Obiettivi, streak, e statistiche avanzate
 */
(function (root) {
  "use strict";

  const GOALS_KEY = "barbell-diva-goals";
  const STATS_KEY = "barbell-diva-advanced-stats";

  // ==========================================
  // GOALS (Punto 9)
  // ==========================================

  // Default goals
  const DEFAULT_GOALS = {
    weeklyWorkouts: { target: 4, current: 0, period: "week" },
    monthlyVolume: { target: 10000, current: 0, period: "month" },
    streakTarget: { target: 7, current: 0, period: "ongoing" },
    prTargets: []
  };

  // Load goals
  function loadGoals() {
    try {
      const data = localStorage.getItem(GOALS_KEY);
      return data ? JSON.parse(data) : { ...DEFAULT_GOALS, prTargets: [] };
    } catch {
      return { ...DEFAULT_GOALS, prTargets: [] };
    }
  }

  // Save goals
  function saveGoals(goals) {
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch {
      // Storage full
    }
  }

  // Update goal progress
  function updateGoalProgress(goalKey, value) {
    const goals = loadGoals();
    if (goals[goalKey]) {
      goals[goalKey].current = value;
      saveGoals(goals);
    }
    return goals[goalKey];
  }

  // Add PR target
  function addPRTarget(exerciseName, targetWeight, targetReps) {
    const goals = loadGoals();
    goals.prTargets.push({
      id: Date.now().toString(36),
      exerciseName,
      targetWeight,
      targetReps,
      achieved: false,
      createdAt: new Date().toISOString()
    });
    saveGoals(goals);
    return goals.prTargets[goals.prTargets.length - 1];
  }

  // Check if PR target achieved
  function checkPRTargetAchieved(exerciseName, weight, reps) {
    const goals = loadGoals();
    let achieved = false;

    goals.prTargets = goals.prTargets.map(target => {
      if (target.exerciseName === exerciseName && !target.achieved) {
        if (weight >= target.targetWeight && reps >= target.targetReps) {
          target.achieved = true;
          target.achievedAt = new Date().toISOString();
          achieved = true;
        }
      }
      return target;
    });

    saveGoals(goals);
    return achieved;
  }

  // Reset weekly goals
  function resetWeeklyGoals() {
    const goals = loadGoals();
    goals.weeklyWorkouts.current = 0;
    saveGoals(goals);
  }

  // Reset monthly goals
  function resetMonthlyGoals() {
    const goals = loadGoals();
    goals.monthlyVolume.current = 0;
    saveGoals(goals);
  }

  // Get goals progress
  function getGoalsProgress() {
    const goals = loadGoals();
    return {
      weeklyWorkouts: {
        ...goals.weeklyWorkouts,
        percent: Math.min(100, Math.round((goals.weeklyWorkouts.current / goals.weeklyWorkouts.target) * 100))
      },
      monthlyVolume: {
        ...goals.monthlyVolume,
        percent: Math.min(100, Math.round((goals.monthlyVolume.current / goals.monthlyVolume.target) * 100))
      },
      streakTarget: {
        ...goals.streakTarget,
        percent: Math.min(100, Math.round((goals.streakTarget.current / goals.streakTarget.target) * 100))
      },
      prTargets: goals.prTargets
    };
  }

  // ==========================================
  // STREAKS (Punto 9)
  // ==========================================

  // Calculate current streak
  function calculateCurrentStreak() {
    const workoutDays = root.BarbellDivaConsistencyHeatmap?.loadWorkoutDays() || {};
    const today = new Date();
    let streak = 0;
    let current = new Date(today);

    const todayKey = formatDateKey(today);
    if (!workoutDays[todayKey]) {
      current.setDate(current.getDate() - 1);
    }

    while (true) {
      const dateKey = formatDateKey(current);
      if (workoutDays[dateKey]) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // Calculate longest streak
  function calculateLongestStreak() {
    const workoutDays = root.BarbellDivaConsistencyHeatmap?.loadWorkoutDays() || {};
    const dates = Object.keys(workoutDays).sort();

    if (dates.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }

  // Get streak milestones
  function getStreakMilestones() {
    const current = calculateCurrentStreak();
    const longest = calculateLongestStreak();
    const milestones = [7, 14, 30, 60, 90, 180, 365];

    return {
      current,
      longest,
      nextMilestone: milestones.find(m => m > current) || null,
      recentMilestones: milestones.filter(m => m <= current).slice(-3)
    };
  }

  // ==========================================
  // ADVANCED STATISTICS (Punto 10)
  // ==========================================

  // Calculate weekly volume
  function getWeeklyVolume(weeksAgo = 0) {
    const progressData = root.BarbellDivaProgressCharts?.loadProgressData() || {};
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - (weeksAgo * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let totalVolume = 0;
    let totalSets = 0;
    let exerciseCount = 0;

    Object.values(progressData).forEach(exercise => {
      let exerciseVolume = 0;
      let exerciseSets = 0;

      exercise.sets?.forEach(set => {
        const setDate = new Date(set.timestamp);
        if (setDate >= startOfWeek && setDate <= endOfWeek) {
          exerciseVolume += set.weight * set.reps;
          exerciseSets++;
        }
      });

      if (exerciseVolume > 0) {
        totalVolume += exerciseVolume;
        totalSets += exerciseSets;
        exerciseCount++;
      }
    });

    return {
      volume: totalVolume,
      sets: totalSets,
      exercises: exerciseCount,
      avgVolumePerSet: totalSets > 0 ? Math.round(totalVolume / totalSets) : 0,
      period: `${formatDateKey(startOfWeek)} - ${formatDateKey(endOfWeek)}`
    };
  }

  // Calculate monthly volume
  function getMonthlyVolume(monthsAgo = 0) {
    const progressData = root.BarbellDivaProgressCharts?.loadProgressData() || {};
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() - monthsAgo + 1, 0);

    let totalVolume = 0;
    let totalSets = 0;

    Object.values(progressData).forEach(exercise => {
      exercise.sets?.forEach(set => {
        const setDate = new Date(set.timestamp);
        if (setDate >= startOfMonth && setDate <= endOfMonth) {
          totalVolume += set.weight * set.reps;
          totalSets++;
        }
      });
    });

    return {
      volume: totalVolume,
      sets: totalSets,
      avgVolumePerSet: totalSets > 0 ? Math.round(totalVolume / totalSets) : 0,
      period: startOfMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
    };
  }

  // Calculate fatigue ratio (volume / recovery)
  function getFatigueRatio() {
    const thisWeek = getWeeklyVolume(0);
    const lastWeek = getWeeklyVolume(1);

    if (lastWeek.volume === 0) return { ratio: 1, trend: "up" };

    const ratio = thisWeek.volume / lastWeek.volume;
    let trend = "stable";
    if (ratio > 1.1) trend = "up";
    else if (ratio < 0.9) trend = "down";

    return { ratio: parseFloat(ratio.toFixed(2)), trend };
  }

  // Compare programs/weeks
  function comparePeriods(period1Start, period1End, period2Start, period2End) {
    const progressData = root.BarbellDivaProgressCharts?.loadProgressData() || {};

    const calcPeriodVolume = (start, end) => {
      let volume = 0;
      let sets = 0;
      Object.values(progressData).forEach(exercise => {
        exercise.sets?.forEach(set => {
          const setDate = new Date(set.timestamp);
          if (setDate >= start && setDate <= end) {
            volume += set.weight * set.reps;
            sets++;
          }
        });
      });
      return { volume, sets };
    };

    const p1 = calcPeriodVolume(period1Start, period1End);
    const p2 = calcPeriodVolume(period2Start, period2End);

    return {
      period1: p1,
      period2: p2,
      volumeDiff: p2.volume - p1.volume,
      volumeDiffPercent: p1.volume > 0 ? Math.round(((p2.volume - p1.volume) / p1.volume) * 100) : 0,
      setsDiff: p2.sets - p1.sets
    };
  }

  // Get personal records summary
  function getPRSummary() {
    const progressData = root.BarbellDivaProgressCharts?.loadProgressData() || {};
    const prs = [];

    Object.values(progressData).forEach(exercise => {
      if (exercise.sets?.length > 0) {
        const best = exercise.sets.reduce((max, set) => {
          if (!max || set.e1rm > max.e1rm) return set;
          return max;
        }, null);

        if (best) {
          prs.push({
            exerciseName: exercise.exerciseName,
            weight: best.weight,
            reps: best.reps,
            e1rm: best.e1rm,
            date: best.date
          });
        }
      }
    });

    return prs.sort((a, b) => b.e1rm - a.e1rm);
  }

  // Get workout frequency
  function getWorkoutFrequency(days = 90) {
    const workoutDays = root.BarbellDivaConsistencyHeatmap?.loadWorkoutDays() || {};
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);

    let workoutCount = 0;
    const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDateKey(d);
      if (workoutDays[dateKey]) {
        workoutCount++;
        dayCounts[d.getDay()]++;
      }
    }

    const weeks = days / 7;
    return {
      totalWorkouts: workoutCount,
      avgPerWeek: (workoutCount / weeks).toFixed(1),
      favoriteDay: Object.entries(dayCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0],
      dayDistribution: dayCounts
    };
  }

  // Helper
  function formatDateKey(date) {
    return date.toISOString().split("T")[0];
  }

  // ==========================================
  // UI COMPONENTS
  // ==========================================

  // Create goals widget
  function createGoalsWidget(containerElement) {
    const goals = getGoalsProgress();
    const widget = document.createElement("div");
    widget.className = "goals-widget";
    widget.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 15px;
      margin: 10px 0;
    `;

    widget.innerHTML = `
      <h4 style="color: #fff; margin: 0 0 15px 0; font-size: 14px;">🎯 Obiettivi</h4>
      
      ${Object.entries({
        weeklyWorkouts: "Allenamenti settimanali",
        monthlyVolume: "Volume mensile (kg)",
        streakTarget: "Streak (giorni)"
      }).map(([key, label]) => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: #888; font-size: 12px;">${label}</span>
            <span style="color: #fff; font-size: 12px; font-weight: bold;">
              ${goals[key].current}/${goals[key].target}
            </span>
          </div>
          <div style="height: 6px; background: #0d0d1a; border-radius: 3px; overflow: hidden;">
            <div style="
              height: 100%;
              width: ${goals[key].percent}%;
              background: linear-gradient(90deg, #ff6fcb 0%, #69e6b0 100%);
              border-radius: 3px;
              transition: width 0.5s ease-out;
            "></div>
          </div>
        </div>
      `).join("")}
    `;

    containerElement.appendChild(widget);
    return widget;
  }

  // Create stats summary widget
  function createStatsSummaryWidget(containerElement) {
    const weekly = getWeeklyVolume(0);
    const fatigue = getFatigueRatio();
    const frequency = getWorkoutFrequency(30);
    const streak = getStreakMilestones();

    const widget = document.createElement("div");
    widget.className = "stats-summary-widget";
    widget.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 15px;
      margin: 10px 0;
    `;

    widget.innerHTML = `
      <h4 style="color: #fff; margin: 0 0 15px 0; font-size: 14px;">📊 Statistiche Avanzate</h4>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="background: #0d0d1a; border-radius: 8px; padding: 10px; text-align: center;">
          <div style="color: #69e6b0; font-size: 20px; font-weight: bold;">${weekly.volume.toLocaleString()}</div>
          <div style="color: #666; font-size: 10px;">Volume settimanale</div>
        </div>
        <div style="background: #0d0d1a; border-radius: 8px; padding: 10px; text-align: center;">
          <div style="color: ${fatigue.trend === "up" ? "#69e6b0" : fatigue.trend === "down" ? "#ff6e7d" : "#a990ff"}; font-size: 20px; font-weight: bold;">
            ${fatigue.ratio}x
          </div>
          <div style="color: #666; font-size: 10px;">Rapporto fatica</div>
        </div>
        <div style="background: #0d0d1a; border-radius: 8px; padding: 10px; text-align: center;">
          <div style="color: #ff6fcb; font-size: 20px; font-weight: bold;">${streak.current}</div>
          <div style="color: #666; font-size: 10px;">Streak attuale</div>
        </div>
        <div style="background: #0d0d1a; border-radius: 8px; padding: 10px; text-align: center;">
          <div style="color: #a990ff; font-size: 20px; font-weight: bold;">${frequency.avgPerWeek}</div>
          <div style="color: #666; font-size: 10px;">Allenamenti/settimana</div>
        </div>
      </div>
    `;

    containerElement.appendChild(widget);
    return widget;
  }

  // Expose API
  root.BarbellDivaGoalsStats = Object.freeze({
    // Goals
    loadGoals,
    saveGoals,
    updateGoalProgress,
    addPRTarget,
    checkPRTargetAchieved,
    resetWeeklyGoals,
    resetMonthlyGoals,
    getGoalsProgress,

    // Streaks
    calculateCurrentStreak,
    calculateLongestStreak,
    getStreakMilestones,

    // Advanced Stats
    getWeeklyVolume,
    getMonthlyVolume,
    getFatigueRatio,
    comparePeriods,
    getPRSummary,
    getWorkoutFrequency,

    // UI
    createGoalsWidget,
    createStatsSummaryWidget
  });
})(typeof window !== "undefined" ? window : globalThis);