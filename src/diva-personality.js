/**
 * Diva Personality Module - Barbell Diva
 * Robottina che reagisce al contesto con messaggi personalizzati.
 * Le funzioni di creazione avatar sono state integrate con la robottina
 * bianca esistente tramite coachMascotHtml() in app-main.js.
 */
(function (root) {
  "use strict";

  var STORAGE_KEY = "barbell-diva-personality-state";

  // Diva mood states
  var MOODS = {
    ENERGETIC: "energetic",
    MOTIVATING: "motivating",
    SUPPORTIVE: "supportive",
    CELEBRATING: "celebrating",
    CONCERNED: "concerned",
    TEACHING: "teaching",
    SLEEPY: "sleepy"
  };

  // Context-aware messages
  var MESSAGES = {
    sessionStart: [
      "Pronta a spaccare? Let's go! 💪",
      "Oggi è il giorno perfetto per superarti!",
      "Diva dice: niente scuse, solo risultati! 🔥",
      "Allenarsi è un atto d'amore verso te stessa! 💅",
      "Ricorda: sei già più forte di ieri! ✨",
      "La palestra ti aspetta, champion! 🏆",
      "Ogni ripetizione ti avvicina alla tua migliore versione! 🌟"
    ],
    encouragement: [
      "Ce la stai facendo benissimo! Continua così! 💪",
      "Senti quella forza? È tutta tua! 🔥",
      "Diva è orgogliosa di te! 💅",
      "Non mollare, sei a metà strada! 🎯",
      "Il dolore di oggi è la forza di domani! 💎",
      "Respira e spingi! Ce la puoi fare! 🌬️",
      "Sei una macchina! 🏋️‍♀️"
    ],
    setCompleted: [
      "Bella serie! 🔥",
      "Continua così, champion! 💪",
      "Diva approva! ✨",
      "Lavoro eccellente! 🌟",
      "Stai andando forte! Non fermarti! 🚀"
    ],
    prAchieved: [
      "NUOVO RECORD! Sei una dea! 👑",
      "INCREDIBILE! Diva è senza parole! 🤯",
      "Hai appena dimostrato di essere imbattibile! 💎",
      "Questo è il momento in cui nasci veramente! 🌟",
      "Stai scrivendo la tua leggenda! 📖✨"
    ],
    highVolume: [
      "Ehi, ricordati di recuperare! Il deload non è una sconfitta 💅",
      "Volume alto rilevato! Ascolta il tuo corpo 🧘‍♀️",
      "Diva suggerisce: forse è momento di una settimana leggera? 🌸",
      "Il sovrallenamento è reale! Prenditi una pausa 😴",
      "La crescita avviene durante il riposo! 🛋️"
    ],
    lowEnergy: [
      "Anche i giorni contano! 💅",
      "Non devi essere perfetta, solo costante! 🌱",
      "Ogni allenamento è un passo avanti, anche quello leggero! 🚶‍♀️",
      "Diva dice: ascoltati, ma non arrenderti mai! 💗",
      "Anche 10 minuti di allenamento fanno la differenza! ⏱️"
    ],
    streakMilestone: [
      "{streak} giorni consecutivi! Sei inarrestabile! 🔥",
      "{streak} giorni di fila! Diva è impressionata! 🤩",
      "Streak di {streak} giorni! Sei una macchina! 🏋️‍♀️",
      "{streak} giorni senza fermarti! LEGGENDARIO! 👑"
    ],
    restDay: [
      "Oggi è giorno di recupero! Il tuo corpo ti ringrazierà 🌸",
      "Riposo attivo: una camminata, stretching... 🧘‍♀️",
      "Diva dice: il riposo fa parte del programma! 💤",
      "Domani sarai più forte grazie al riposo di oggi! 🌙"
    ],
    welcomeBack: [
      "Eccoti di nuovo! Ti aspettavamo! 💅",
      "Bentornata! Pronta a ripartire? 🚀",
      "L'assenza è stata notata! Ma ora sei tornata! 💪",
      "Diva ti dà il benvenuto! Andiamo! ✨"
    ],
    formReminder: [
      "Ricorda: tecnica prima del peso! 🎯",
      "Controlla la tua postura! 🧘‍♀️",
      "Diva dice: qualità > quantità! 💎",
      "Movimento pulito = risultati puliti! ✨"
    ],
    hydration: [
      "Bevi acqua! I muscoli hanno sete! 💧",
      "Idratazione = performance! 💦",
      "Diva ricorda: l'acqua è tua amica! 🌊"
    ],
    warmup: [
      "Hai fatto il warmup? I muscoli freddi non sono amici! 🔥",
      "5 minuti di riscaldamento fanno la differenza! 🌡️",
      "Diva dice: prepara il corpo prima di sforzarti! 🏃‍♀️"
    ]
  };

  /* Mappa i mood alle espressioni della robottina */
  var MOOD_TO_EXPRESSION = {
    energetic: "happy",
    motivating: "motivated",
    supportive: "love",
    celebrating: "celebrating",
    concerned: "thinking",
    teaching: "thinking",
    sleepy: "rest"
  };
  // Get current personality state
  function getState() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
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
    var messages = MESSAGES[category] || MESSAGES.encouragement;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Get contextual message based on workout state
  function getContextualMessage(context) {
    var type = context.type;
    var data = context.data || {};

    switch (type) {
      case "sessionStart": return getRandomMessage("sessionStart");
      case "setCompleted": return getRandomMessage("setCompleted");
      case "prAchieved": return getRandomMessage("prAchieved");
      case "highVolume": return getRandomMessage("highVolume");
      case "lowEnergy": return getRandomMessage("lowEnergy");
      case "streakMilestone": return getRandomMessage("streakMilestone").replace("{streak}", data.streak || 0);
      case "restDay": return getRandomMessage("restDay");
      case "welcomeBack": return getRandomMessage("welcomeBack");
      case "formReminder": return getRandomMessage("formReminder");
      case "hydration": return getRandomMessage("hydration");
      case "warmup": return getRandomMessage("warmup");
      default: return getRandomMessage("encouragement");
    }
  }

  // Create Diva avatar element - ora usa la robottina SVG esistente
  function createDivaAvatar(containerElement, options) {
    options = options || {};
    var size = options.size || 80;
    var mood = options.mood || MOODS.ENERGETIC;
    var showMessage = options.showMessage !== false;
    var message = options.message || null;

    // Usa la classe .diva-bot esistente della robottina
    var avatar = document.createElement("div");
    avatar.className = "diva-avatar";
    avatar.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 10px; " + (containerElement ? "margin: 0 auto;" : "");

    // SVG della robottina bianca (inline nell'avatar)
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 240 260");
    svg.setAttribute("class", "diva-bot");
    svg.style.cssText = "width: 100%; height: auto;";

    // Imposta l'espressione iniziale in base al mood
    svg.innerHTML = buildDivaBotSvg(MOOD_TO_EXPRESSION[mood] || "happy");
    avatar.appendChild(svg);

    if (showMessage && message) {
      var bubble = document.createElement("div");
      bubble.className = "diva-message";
      bubble.style.cssText = "background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid " + (MOOD_COLORS[mood] || "#ff6fcb") + "; border-radius: 15px; padding: 12px 18px; max-width: 250px; text-align: center; color: #fff; font-size: 13px; line-height: 1.4; position: relative; animation: divaFadeIn 0.3s ease-out;";
      bubble.textContent = message;
      avatar.appendChild(bubble);
    }

    if (containerElement) {
      containerElement.appendChild(avatar);
    }

    return avatar;
  }

  var MOOD_COLORS = {
    energetic: "#ff6fcb",
    motivating: "#69e6b0",
    supportive: "#a990ff",
    celebrating: "#69e6b0",
    concerned: "#ff9b49",
    teaching: "#a990ff",
    sleepy: "#666"
  };

  // Genera il markup SVG della robottina con un'espressione specifica
  function buildDivaBotSvg(faceClass) {
    var faces = {
      idle: '<g class="diva-bot-face-idle"><g class="diva-bot-eyes"><circle class="diva-bot-face-fill" cx="93" cy="117" r="8"/><circle class="diva-bot-face-fill" cx="147" cy="117" r="8"/></g><path class="diva-bot-face-stroke" d="M103 137q17 15 34 0"/></g>',
      happy: '<g class="diva-bot-face-idle"><g class="diva-bot-eyes"><circle class="diva-bot-face-fill" cx="93" cy="117" r="8"/><circle class="diva-bot-face-fill" cx="147" cy="117" r="8"/></g><path class="diva-bot-face-stroke" d="M103 137q17 15 34 0"/></g>',
      celebrating: '<g class="diva-bot-face-happy"><g class="diva-bot-eyes"><path class="diva-bot-face-stroke" d="M80 119q13-21 26 0M134 119q13-21 26 0"/></g><path class="diva-bot-face-fill" d="M101 135q19 24 38 0c-4 28-34 28-38 0Z"/></g>',
      thinking: '<g class="diva-bot-face-thinking"><g class="diva-bot-eyes"><circle class="diva-bot-face-fill" cx="92" cy="117" r="8"/><path class="diva-bot-face-stroke" d="M137 117q11-12 22 0"/></g><path class="diva-bot-face-stroke" d="M109 139q11 5 22 0"/></g>',
      rest: '<g class="diva-bot-face-rest"><g class="diva-bot-eyes"><path class="diva-bot-face-stroke" d="M80 119h26M134 119h26"/></g><path class="diva-bot-face-stroke" d="M109 139h22"/><text x="171" y="86" fill="#ff72c2" font-size="20" font-weight="800">Z</text></g>'
    };

    var faceSvg = faces[faceClass] || faces.idle;

    return '<g class="diva-bot-antenna"><path d="M120 49V31" fill="none" stroke="#c7b8d8" stroke-width="7" stroke-linecap="round"/><path d="M120 29c-13-15-30 4 0 23 30-19 13-38 0-23Z" fill="#ff72c2" stroke="#ffe1f4" stroke-width="3"/></g><g class="diva-bot-arm diva-bot-arm-left"><circle class="diva-bot-joint" cx="68" cy="177" r="13"/><path class="diva-bot-shell" d="M64 171c-17 1-27 13-28 29-1 12 7 20 17 17 9-3 13-15 16-30Z"/><circle class="diva-bot-joint" cx="47" cy="211" r="10"/></g><g class="diva-bot-arm diva-bot-arm-right"><circle class="diva-bot-joint" cx="172" cy="177" r="13"/><path class="diva-bot-shell" d="M176 171c17 1 27 13 28 29 1 12-7 20-17 17-9-3-13-15-16-30Z"/><circle class="diva-bot-joint" cx="193" cy="211" r="10"/></g><g class="diva-bot-body"><path class="diva-bot-shell" d="M76 164c10-14 78-14 88 0l-7 68c-13 16-61 16-74 0Z"/><path d="M86 176h68l-5 42c-13 11-45 11-58 0Z" fill="#ded5e9" stroke="#9f87bb" stroke-width="3"/><path class="diva-bot-heart-shape" d="M120 189c-10-12-24 3 0 20 24-17 10-32 0-20Z"/><path class="diva-bot-shell" d="M90 230l-8 18h34l4-16m30-2 8 18h-34l-4-16"/></g><g class="diva-bot-head"><path class="diva-bot-shell" d="M45 73c15-27 135-27 150 0 12 20 12 72-3 91-21 27-123 27-144 0-15-19-15-71-3-91Z"/><path d="M41 96c-16 5-18 44-1 51m159-51c16 5 18 44 1 51" fill="#bba9cf" stroke="#ff72c2" stroke-width="7" stroke-linecap="round"/><rect class="diva-bot-screen" x="57" y="83" width="126" height="77" rx="31"/><path class="diva-bot-screen-glint" d="M75 92c20-8 67-10 91 0-37 1-68 8-92 22-5-8-4-16 1-22Z"/></g>' + faceSvg + '</g>';
  }

  // Show a Diva message popup - usa la robottina esistente
  function showDivaMessage(context) {
    var message = getContextualMessage(context);
    var mood = context.mood || MOODS.ENERGETIC;

    // Dispatch evento per la robottina principale
    root.dispatchEvent(new CustomEvent("divaBotPersonalitieshowDivaMessage", {
      detail: { text: message, mood: mood, expression: MOOD_TO_EXPRESSION[mood] || "happy" }
    }));

    // Mostra popup fluttuante
    showMessagePopup(message, mood);

    saveState({ mood: mood, lastInteraction: Date.now() });
  }

  function showMessagePopup(message, mood) {
    var existing = document.querySelector(".diva-popup");
    if (existing) existing.remove();

    var color = MOOD_COLORS[mood] || "#ff6fcb";

    var popup = document.createElement("div");
    popup.className = "diva-popup";
    popup.style.cssText = "position: fixed; bottom: 110px; right: 20px; max-width: 260px; padding: 18px 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid " + color + "; border-radius: 18px; color: #fff; font-size: 14px; z-index: 9998; box-shadow: 0 10px 30px rgba(255,111,203,0.3); backdrop-filter: blur(4px); animation: divaFadeIn 0.3s ease-out;";

    popup.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span style="font-size:24px;">💅</span><span style="color:#ff6fcb;font-weight:bold;font-size:16px;">DIVA</span></div><div>' + message + '</div>';

    document.body.appendChild(popup);

    setTimeout(function() {
      if (popup.parentNode) {
        popup.style.opacity = "0";
        popup.style.transition = "opacity 0.3s";
        setTimeout(function() { popup.remove(); }, 300);
      }
    }, 5000);
  }

  // Analyze workout context and show appropriate message
  function analyzeAndReact(contextData) {
    var totalSets = contextData.totalSets;
    var completedSets = contextData.completedSets;
    var currentVolume = contextData.currentVolume;
    var averageIntensity = contextData.averageIntensity;
    var streak = contextData.streak;
    var daysSinceLastWorkout = contextData.daysSinceLastWorkout;
    var isRestDay = contextData.isRestDay;

    var context;

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
      context = { type: "streakMilestone", mood: MOODS.CELEBRATING, data: { streak: streak } };
    } else if (completedSets > 0 && completedSets % 3 === 0) {
      context = { type: "setCompleted", mood: MOODS.MOTIVATING };
    } else {
      context = { type: "encouragement", mood: MOODS.ENERGETIC };
    }

    return showDivaMessage(context);
  }

  // Expose API
  root.BarbellDivaPersonality = Object.freeze({
    MOODS: MOODS,
    MESSAGES: MESSAGES,
    getState: getState,
    saveState: saveState,
    getRandomMessage: getRandomMessage,
    getContextualMessage: getContextualMessage,
    createDivaAvatar: createDivaAvatar,
    showDivaMessage: showDivaMessage,
    analyzeAndReact: analyzeAndReact
  });
})(typeof window !== "undefined" ? window : globalThis);
