/**
 * Notifications Module - Barbell Diva
 * Push notifications per promemoria allenamento
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "barbell-diva-notifications";
  const DEFAULT_SETTINGS = {
    enabled: false,
    workoutReminder: true,
    reminderTime: "09:00",
    streakReminder: true,
    restDayReminder: true,
    prCelebration: true
  };

  // Load notification settings
  function loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  // Save notification settings
  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage full
    }
  }

  // Check if notifications are supported
  function isSupported() {
    return "Notification" in window;
  }

  // Check permission status
  function getPermissionStatus() {
    if (!isSupported()) return "unsupported";
    return Notification.permission;
  }

  // Request notification permission
  async function requestPermission() {
    if (!isSupported()) {
      return { success: false, error: "Notifiche non supportate" };
    }

    try {
      const permission = await Notification.requestPermission();
      const settings = loadSettings();
      settings.enabled = permission === "granted";
      saveSettings(settings);

      return {
        success: permission === "granted",
        permission
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Show a notification
  function showNotification(title, options = {}) {
    if (!isSupported() || Notification.permission !== "granted") {
      return null;
    }

    const settings = loadSettings();
    if (!settings.enabled) return null;

    const defaultOptions = {
      icon: "app-icon-192.png",
      badge: "app-icon-192.png",
      vibrate: [200, 100, 200],
      tag: "barbell-diva",
      renotify: true,
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) options.onClick();
      };

      return notification;
    } catch {
      return null;
    }
  }

  // Schedule workout reminder
  function scheduleWorkoutReminder() {
    const settings = loadSettings();
    if (!settings.enabled || !settings.workoutReminder) return;

    const now = new Date();
    const [hours, minutes] = settings.reminderTime.split(":").map(Number);
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const delay = reminderTime - now;

    setTimeout(() => {
      showNotification("🏋️‍♀️ Barbell Diva", {
        body: "È ora di allenarsi! Diva ti aspetta! 💪",
        tag: "workout-reminder",
        onClick: () => {
          // Open workout screen
        }
      });
      // Reschedule for next day
      scheduleWorkoutReminder();
    }, delay);
  }

  // Show streak reminder
  function showStreakReminder(streak) {
    const settings = loadSettings();
    if (!settings.enabled || !settings.streakReminder) return;

    showNotification("🔥 Streak in pericolo!", {
      body: `Hai una streak di ${streak} giorni! Non romperla ora!`,
      tag: "streak-reminder"
    });
  }

  // Show rest day reminder
  function showRestDayReminder() {
    const settings = loadSettings();
    if (!settings.enabled || !settings.restDayReminder) return;

    showNotification("🌸 Giorno di recupero", {
      body: "Oggi è giorno di riposo! Il tuo corpo ti ringrazierà!",
      tag: "rest-day"
    });
  }

  // Show PR celebration notification
  function showPRNotification(exerciseName, weight, reps) {
    const settings = loadSettings();
    if (!settings.enabled || !settings.prCelebration) return;

    showNotification("🎉 NUOVO PR!", {
      body: `${exerciseName}: ${weight}kg x ${reps} reps! Sei una dea!`,
      tag: "pr-celebration",
      requireInteraction: true
    });
  }

  // Show goal achieved notification
  function showGoalAchievedNotification(goalName) {
    const settings = loadSettings();
    if (!settings.enabled) return;

    showNotification("🎯 Obiettivo raggiunto!", {
      body: `Hai completato: ${goalName}! Complimenti!`,
      tag: "goal-achieved"
    });
  }

  // Create notification settings UI
  function createNotificationSettings(containerElement) {
    const settings = loadSettings();
    const permissionStatus = getPermissionStatus();

    const settingsPanel = document.createElement("div");
    settingsPanel.className = "notification-settings";
    settingsPanel.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 15px;
      margin: 10px 0;
    `;

    settingsPanel.innerHTML = `
      <h4 style="color: #fff; margin: 0 0 15px 0; font-size: 14px;">🔔 Notifiche</h4>
      
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="color: #888; font-size: 12px;">Stato</span>
          <span style="color: ${permissionStatus === "granted" ? "#69e6b0" : "#ff6e7d"}; font-size: 12px; font-weight: bold;">
            ${permissionStatus === "granted" ? "✓ Attive" : permissionStatus === "denied" ? "✕ Bloccate" : "○ Non attive"}
          </span>
        </div>
        
        ${permissionStatus !== "granted" ? `
          <button id="enable-notifications" style="
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, #ff6fcb 0%, #a990ff 100%);
            border: none;
            border-radius: 8px;
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
          ">Attiva Notifiche</button>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${createToggle("Promemoria allenamento", "workoutReminder", settings.workoutReminder)}
            ${createToggle("Promemoria streak", "streakReminder", settings.streakReminder)}
            ${createToggle("Giorno di recupero", "restDayReminder", settings.restDayReminder)}
            ${createToggle("Celebrazioni PR", "prCelebration", settings.prCelebration)}
          </div>
          
          <div style="margin-top: 10px;">
            <label style="color: #888; font-size: 11px;">Orario promemoria</label>
            <input type="time" id="reminder-time" value="${settings.reminderTime}" style="
              width: 100%;
              padding: 8px;
              background: #0d0d1a;
              border: 1px solid #333;
              border-radius: 6px;
              color: #fff;
              font-size: 12px;
              margin-top: 5px;
            ">
          </div>
        `}
      </div>
    `;

    containerElement.appendChild(settingsPanel);

    // Event handlers
    const enableBtn = settingsPanel.querySelector("#enable-notifications");
    if (enableBtn) {
      enableBtn.addEventListener("click", async () => {
        const result = await requestPermission();
        if (result.success) {
          createNotificationSettings(containerElement);
          showNotification("🔔 Notifiche attivate!", {
            body: "Riceverai promemoria per i tuoi allenamenti!",
            tag: "welcome"
          });
        }
      });
    }

    // Toggle handlers
    settingsPanel.querySelectorAll(".notification-toggle").forEach(toggle => {
      toggle.addEventListener("change", (e) => {
        const newSettings = loadSettings();
        newSettings[e.target.dataset.setting] = e.target.checked;
        saveSettings(newSettings);
      });
    });

    // Time handler
    const timeInput = settingsPanel.querySelector("#reminder-time");
    if (timeInput) {
      timeInput.addEventListener("change", (e) => {
        const newSettings = loadSettings();
        newSettings.reminderTime = e.target.value;
        saveSettings(newSettings);
      });
    }

    return settingsPanel;
  }

  function createToggle(label, settingKey, value) {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #888; font-size: 12px;">${label}</span>
        <label style="position: relative; display: inline-block; width: 40px; height: 22px;">
          <input type="checkbox" class="notification-toggle" data-setting="${settingKey}" ${value ? "checked" : ""} style="opacity: 0; width: 0; height: 0;">
          <span style="
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background: ${value ? "#69e6b0" : "#333"};
            border-radius: 22px;
            transition: 0.3s;
          ">
            <span style="
              position: absolute;
              content: '';
              height: 18px;
              width: 18px;
              left: 2px;
              bottom: 2px;
              background: #fff;
              border-radius: 50%;
              transition: 0.3s;
              transform: ${value ? "translateX(18px)" : "translateX(0)"};
            "></span>
          </span>
        </label>
      </div>
    `;
  }

  // Initialize notifications on app start
  function init() {
    const settings = loadSettings();
    if (settings.enabled && settings.workoutReminder) {
      scheduleWorkoutReminder();
    }
  }

  // Expose API
  root.BarbellDivaNotifications = Object.freeze({
    isSupported,
    getPermissionStatus,
    requestPermission,
    showNotification,
    scheduleWorkoutReminder,
    showStreakReminder,
    showRestDayReminder,
    showPRNotification,
    showGoalAchievedNotification,
    createNotificationSettings,
    loadSettings,
    saveSettings,
    init
  });
})(typeof window !== "undefined" ? window : globalThis);