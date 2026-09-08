/**
 * Diva Personality Module - Barbell Diva
 * Mascotte che reagisce al contesto con messaggi personalizzati
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "barbell-diva-personality-state";

  // Diva mood states
  const MOODS = {
    ENERGETIC: "energetic",
    MOTIVATING: "motivating",
    SUPPORTIVE: "supportive",
    CELEBRATING: "celebrating",
    CONCERNED: "concerned",
    TEACHING: "teaching",
    SLEEPY: "sleepy"
  };

  // Context-aware messages
  const MESSAGES = {
    // Session start
    sessionStart: [
      "Pronta a spaccare? Let's go! 💪",
      "Oggi è il giorno perfetto per superarti!",
      "Diva dice: niente scuse, solo risultati! 🔥",
      "Allenarsi è un atto d'amore verso te stessa! 💅",
      "Ricorda: sei già più forte di ieri! ✨",
      "La palestra ti aspetta, champion! 🏆",
      "Ogni ripetizione ti avvicina alla tua migliore versione! 🌟"
    ],

    // During workout - encouragement
    encouragement: [
      "Ce la stai facendo benissimo! Continua così! 💪",
      "Senti quella forza? È tutta tua! 🔥",
      "Diva è orgogliosa di te! 💅",
      "Non mollare, sei a metà strada! 🎯",
      "Il dolore di oggi è la forza di domani! 💎",
      "Respira e spingi! Ce la puoi fare! 🌬️",
      "Sei una macchina! 🏋️‍♀️"
    ],

    // Set completed
    setCompleted: [
      "Bella serie! 🔥",
      "Continua così, champion! 💪",
      "Diva approva! ✨",
      "Lavoro eccellente! 🌟",
      "Stai andando forte! Non fermarti! 🚀"
    ],

    // PR achieved
    prAchieved: [
      "NUOVO RECORD! Sei una dea! 👑",
      "INCREDIBILE! Diva è senza parole! 🤯",
      "Hai appena dimostrato di essere imbattibile! 💎",
      "Questo è il momento in cui nasci veramente! 🌟",
      "Stai scrivendo la tua leggenda! 📖✨"
    ],

    // High volume warning
    highVolume: [
      "Ehi, ricordati di recuperare! Il deload non è una sconfitta 💅",
      "Volume alto rilevato! Ascolta il tuo corpo 🧘‍♀️",
      "Diva suggerisce: forse è momento di una settimana leggera? 🌸",
      "Il sovrallenamento è reale! Prenditi una pausa 😴",
      "La crescita avviene durante il riposo! 🛋️"
    ],

    // Low energy / bad day
    lowEnergy: [
      "Anche i giorni contano! 💅",
      "Non devi essere perfetta, solo costante! 🌱",
      "Ogni allenamento è un passo avanti, anche quello leggero! 🚶‍♀️",
      "Diva dice: ascoltati, ma non arrenderti mai! 💗",
      "Anche 10 minuti di allenamento fanno la differenza! ⏱️"
    ],

    // Streak milestone
    streakMilestone: [
      "{streak} giorni consecutivi! Sei inarrestabile! 🔥",
      "{streak} giorni di fila! Diva è impressionata! 🤩",
      "Streak di {streak} giorni! Sei una macchina! 🏋️‍♀️",
      "{streak} giorni senza fermarti! LEGGENDARIO! 👑"
    ],

    // Rest day reminder
    restDay: [
      "Oggi è giorno di recupero! Il tuo corpo ti ringrazierà 🌸",
      "Riposo attivo: una camminata, stretching... 🧘‍♀️",
      "Diva dice: il riposo fa parte del programma! 💤",
      "Domani sarai più forte grazie al riposo di oggi! 🌙"
    ],

    // Welcome back (after absence)
    welcomeBack: [
      "Eccoti di nuovo! Ti aspettavamo! 💅",
      "Bentornata! Pronta a ripartire? 🚀",
      "L'assenza è stata notata! Ma ora sei tornata! 💪",
      "Diva ti dà il benvenuto! Andiamo! ✨"
    ],

    // Form reminder
    formReminder: [
      "Ricorda: tecnica prima del peso! 🎯",
      "Controlla la tua postura! 🧘‍♀️",
      "Diva dice: qualità > quantità! 💎",
      "Movimento pulito = risultati puliti! ✨"
    ],

    // Hydration reminder
    hydration: [
      "Bevi acqua! I muscoli hanno sete! 💧",
      "Idratazione = performance! 💦",
      "Diva ricorda: l'acqua è tua amica! 🌊"
    ],

    // Warmup reminder
    warmup: [
      "Hai fatto il warmup? I muscoli freddi non sono amici! 🔥",
      "5 minuti di riscaldamento fanno la differenza! 🌡️",
      "Diva dice: prepara il corpo prima di sforzarti! 🏃‍♀️"
    ]
  };

  // Get current personality state
  function getState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { mood: MOODS.ENERGETIC, lastInteraction: null };
    } catch {
      return { mood: MOODS.ENERGETIC, lastInteraction: null };
    }
  }

  // Save personality state
  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable
    }
  }

  // Get random message from category
  function getRandomMessage(category) {
    const messages = MESSAGES[category] || MESSAGES.encouragement;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Get contextual message based on workout state
  function getContextualMessage(context) {
    const { type, data = {} } = context;

    switch (type) {
      case "sessionStart":
        return getRandomMessage("sessionStart");

      case "setCompleted":
        return getRandomMessage("setCompleted");

      case "prAchieved":
        return getRandomMessage("prAchieved");

      case "highVolume":
        return getRandomMessage("highVolume");

      case "lowEnergy":
        return getRandomMessage("lowEnergy");

      case "streakMilestone":
        return getRandomMessage("streakMilestone").replace("{streak}", data.streak || 0);

      case "restDay":
        return getRandomMessage("restDay");

      case "welcomeBack":
        return getRandomMessage("welcomeBack");

      case "formReminder":
        return getRandomMessage("formReminder");

      case "hydration":
        return getRandomMessage("hydration");

      case "warmup":
        return getRandomMessage("warmup");

      default:
        return getRandomMessage("encouragement");
    }
  }

  // Create Diva avatar element
  function createDivaAvatar(containerElement, options = {}) {
    const {
      size = 80,
      mood = MOODS.ENERGETIC,
      showMessage = true,
      message = null
    } = options;

    const avatar = document.createElement("div");
    avatar.className = "diva-avatar";
    avatar.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      ${containerElement ? "margin: 0 auto;" : ""}
    `;

    // SVG Diva mascot
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.style.cssText = `
      animation: divaBounce 2s ease-in-out infinite;
    `;

    // Colors based on mood
    const moodColors = {
      energetic: { primary: "#ff6fcb", secondary: "#ff9b49" },
      motivating: { primary: "#69e6b0", secondary: "#4d8c60" },
      supportive: { primary: "#a990ff", secondary: "#7c5cff" },
      celebrating: { primary: "#ff6fcb", secondary: "#69e6b0" },
      concerned: { primary: "#ff9b49", secondary: "#ff6e7d" },
      teaching: { primary: "#a990ff", secondary: "#ff6fcb" },
      sleepy: { primary: "#666", secondary: "#444" }
    };

    const colors = moodColors[mood] || moodColors.energetic;

    svg.innerHTML = `
      <!-- Head -->
      <circle cx="50" cy="35" r="25" fill="${colors.primary}"/>
      <!-- Body -->
      <ellipse cx="50" cy="75" rx="20" ry="25" fill="${colors.secondary}"/>
      <!-- Eyes -->
      <circle cx="40" cy="30" r="4" fill="#fff"/>
      <circle cx="60" cy="30" r="4" fill="#fff"/>
      <circle cx="41" cy="31" r="2" fill="#1a1a2e"/>
      <circle cx="61" cy="31" r="2" fill="#1a1a2e"/>
      <!-- Smile -->
      <path d="M 40 42 Q 50 50 60 42" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Hair/Crown -->
      <path d="M 25 20 Q 30 10 35 18" stroke="${colors.primary}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 75 20 Q 70 10 65 18" stroke="${colors.primary}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="20" cy="15" r="5" fill="${colors.secondary}"/>
      <circle cx="80" cy="15" r="5" fill="${colors.secondary}"/>
      <!-- Sparkles when celebrating -->
      ${mood === "celebrating" ? `
        <circle cx="15" cy="50" r="3" fill="#ff6fcb"/>
        <circle cx="85" cy="50" r="3" fill="#69e6b0"/>
        <circle cx="50" cy="10" r="3" fill="#a990ff"/>
      ` : ""}
    `;

    avatar.appendChild(svg);

    // Message bubble
    if (showMessage && message) {
      const bubble = document.createElement("div");
      bubble.className = "diva-message";
      bubble.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid ${colors.primary};
        border-radius: 15px;
        padding: 12px 18px;
        max-width: 250px;
        text-align: center;
        color: #fff;
        font-size: 13px;
        line-height: 1.4;
        position: relative;
        animation: divaFadeIn 0.3s ease-out;
      `;
      bubble.textContent = message;
      avatar.appendChild(bubble);
    }

    // Add styles
    addDivaStyles();

    if (containerElement) {
      containerElement.appendChild(avatar);
    }

    return avatar;
  }

  function addDivaStyles() {
    if (document.getElementById("diva-styles")) return;

    const styles = document.createElement("style");
    styles.id = "diva-styles";
    styles.textContent = `
      @keyframes divaBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      @keyframes divaFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes divaPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(styles);
  }

  // Show contextual Diva message
  function showDivaMessage(context, targetElement) {
    const message = getContextualMessage(context);
    const mood = context.mood || MOODS.ENERGETIC;

    // Remove existing diva message if any
    const existing = document.querySelector(".diva-message-popup");
    if (existing) existing.remove();

    const popup = document.createElement("div");
    popup.className = "diva-message-popup";
    popup.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 20px;
      right: 20px;
      max-width: 350px;
      margin: 0 auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 15px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #ff6fcb;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(255, 111, 203, 0.3);
      z-index: 9999;
      animation: divaSlideUp 0.3s ease-out;
    `;

    // Mini avatar
    const miniAvatar = document.createElement("div");
    miniAvatar.style.cssText = `
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #ff6fcb 0%, #a990ff 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    `;
    miniAvatar.textContent = "👑";

    // Message content
    const content = document.createElement("div");
    content.style.cssText = "flex: 1;";
    content.innerHTML = `
      <div style="color: #ff6fcb; font-size: 11px; font-weight: bold; margin-bottom: 3px;">DIVA</div>
      <div style="color: #fff; font-size: 13px; line-height: 1.4;">${message}</div>
    `;

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #666;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    `;
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => popup.remove());

    popup.appendChild(miniAvatar);
    popup.appendChild(content);
    popup.appendChild(closeBtn);

    document.body.appendChild(popup);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (popup.parentNode) {
        popup.style.animation = "divaSlideUp 0.3s ease-out reverse";
        setTimeout(() => popup.remove(), 300);
      }
    }, 5000);

    // Update state
    saveState({ mood, lastInteraction: Date.now() });

    return popup;
  }

  // Analyze workout context and show appropriate message
  function analyzeAndReact(contextData) {
    const {
      totalSets,
      completedSets,
      currentVolume,
      averageIntensity,
      streak,
      daysSinceLastWorkout,
      isRestDay
    } = contextData;

    // Determine context
    let context;

    if (isRestDay) {
      context = { type: "restDay", mood: MOODS.SUPPORTIVE };
    } else if (daysSinceLastWorkout > 3) {
      context = { type: "welcomeBack", mood: MOODS.MOTIVATING };
    } else if (completedSets === 0) {
      context = { type: "sessionStart", mood: MOODS.ENERGETIC };
    } else if (currentVolume > 2000) {
      context = { type: "highVolume", mood: MOODS.CONCERNED };
    } else if (averageIntensity < 2 && completedSets > 3) {
      context = { type: "lowEnergy", mood: MOODS.SUPPORTIVE };
    } else if (streak > 0 && streak % 7 === 0) {
      context = { type: "streakMilestone", mood: MOODS.CELEBRATING, data: { streak } };
    } else if (completedSets > 0 && completedSets % 3 === 0) {
      context = { type: "setCompleted", mood: MOODS.MOTIVATING };
    } else {
      context = { type: "encouragement", mood: MOODS.ENERGETIC };
    }

    return showDivaMessage(context);
  }

  // Expose API
  root.BarbellDivaPersonality = Object.freeze({
    MOODS,
    MESSAGES,
    getState,
    saveState,
    getRandomMessage,
    getContextualMessage,
    createDivaAvatar,
    showDivaMessage,
    analyzeAndReact
  });
})(typeof window !== "undefined" ? window : globalThis);