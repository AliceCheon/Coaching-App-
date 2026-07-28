/* ============================================================================
   Barbell Diva — v146.1 · Enhance Editor Schede
   Non tocca il render originale del programming-engine.js.
   Aggiunge:
    - Toggle "Colonne avanzate" nella toolbar settimana
    - Rename colonna "Carico" → "Peso"
    - Pulsante Trend ↗ per riga (bind al modal Trend settimana esistente)
    - Sostituzione icona dettagli con thumbnail video se disponibile
    - Riorganizzazione header giorno (pill durata, pencil edit)
    - Footer per-giorno "+ Esercizio  + Circuito"
    - Marca celle RPE/RIR/TUT con classi utili al toggle CSS
   ========================================================================= */
(function () {
  "use strict";

  // localStorage key per persistere il toggle
  const LS_HIDE_ADVANCED = "barbellDiva.schede.hideAdvancedCols";

  // Applica il flag colonne avanzate al body dallo state persistito
  function applyAdvancedColsState() {
    const hide = localStorage.getItem(LS_HIDE_ADVANCED) === "1";
    document.body.classList.toggle("schede-hide-advanced", hide);
    return hide;
  }
  applyAdvancedColsState();

  // Espone helper per il pattern-look-up del video URL nella master library
  function getVideoForExercise(exerciseName) {
    if (!exerciseName) return null;
    const bridgeVideo = window.BarbellDivaV146Bridge?.exerciseMedia?.(exerciseName);
    if (bridgeVideo) return bridgeVideo;
    const lib = window.BarbellDivaMasterLibrary;
    if (!lib || typeof lib.list !== "function") return null;
    try {
      const items = lib.list();
      const target = String(exerciseName).trim().toLowerCase();
      const item = items.find(
        (x) =>
          x && String(x.name || "").trim().toLowerCase() === target,
      );
      if (!item) return null;
      return (
        item.videoUrl ||
        item.video ||
        item.media?.video ||
        item.media?.videoUrl ||
        item.metadata?.videoUrl ||
        null
      );
    } catch {
      return null;
    }
  }

  // Estrae la durata da "N esercizi · M serie · circa T min · muscoli"
  function extractDuration(text) {
    if (!text) return null;
    const m = /circa\s+([\d,\.\s\-]+)\s*min/i.exec(text);
    if (m) return `${m[1].trim().replace(/\s+/g, "")} min`;
    return null;
  }

  function extractFocus(text) {
    if (!text) return [];
    const parts = String(text).split("·").map((item) => item.trim()).filter(Boolean);
    const focus = parts.at(-1) || "";
    if (/^\d+\s*(esercizi|serie|min)/i.test(focus)) return [];
    return focus.split(/,|\/|\+/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
  }

  // Applica trasformazioni a un blocco .coach-editor-weekly
  function enhanceEditor(root) {
    if (!root) return;

    // 1) Toggle "Colonne avanzate" nella toolbar settimana
    const weekTools = root.querySelector(".coach-week-tools > div");
    if (weekTools && !weekTools.querySelector(".schede-v146-toggle")) {
      const label = document.createElement("label");
      label.className = "schede-v146-toggle";
      label.title = "Mostra/nascondi le colonne RPE, RIR, TUT";
      label.innerHTML = `
        <input type="checkbox" ${localStorage.getItem(LS_HIDE_ADVANCED) === "1" ? "" : "checked"}>
        <span>Colonne avanzate</span>
      `;
      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        const hide = !input.checked;
        localStorage.setItem(LS_HIDE_ADVANCED, hide ? "1" : "0");
        applyAdvancedColsState();
      });
      weekTools.appendChild(label);
    }

    // 2) Rename colonna "Carico" → "Peso" + marca celle RPE/RIR/TUT
    root.querySelectorAll("table thead th").forEach((th, idx) => {
      const t = (th.textContent || "").trim().toLowerCase();
      if (t === "carico") th.textContent = "Peso";
      if (t === "rpe") th.classList.add("col-header-rpe");
      if (t === "rir") th.classList.add("col-header-rir");
      if (t === "tut") th.classList.add("col-header-tut");
    });

    // 3) Marca celle RPE/RIR/TUT nel corpo tramite data-label
    root.querySelectorAll(".coach-inline-exercise").forEach((tr) => {
      tr.querySelectorAll("td[data-label]").forEach((td) => {
        const lbl = (td.getAttribute("data-label") || "").toLowerCase();
        if (lbl === "carico") td.setAttribute("data-label", "Peso");
        if (lbl === "rpe") td.classList.add("col-cell-rpe");
        if (lbl === "rir") td.classList.add("col-cell-rir");
        if (lbl === "tut") td.classList.add("col-cell-tut");
      });

      // 4) Note pill "has-note" se testo presente
      const noteBtn = tr.querySelector(".coach-inline-note");
      if (noteBtn) {
        const em = noteBtn.querySelector("em");
        const hasText = em && em.textContent && em.textContent.trim().length > 0 && em.textContent.trim() !== "Aggiungi nota";
        noteBtn.classList.toggle("has-note", !!hasText);
      }

      // 5) Video thumbnail al posto di ⓘ (details)
      const detailsBtn = tr.querySelector('[data-exercise-action="details"]');
      if (detailsBtn && !detailsBtn.dataset.schedeV146Bound) {
        detailsBtn.dataset.schedeV146Bound = "1";
      }

      // 6) Storico pesi del singolo esercizio.
      const historyBtn = tr.querySelector("[data-schede-weight-history]");
      if (historyBtn && !historyBtn.dataset.schedeHistoryBound) {
        historyBtn.dataset.schedeHistoryBound = "1";
        historyBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const nm = tr.querySelector(".coach-exercise-name-text");
          if (nm) window.__lastTrendExerciseName = nm.textContent.trim();
          const bridge = window.BarbellDivaV146Bridge;
          if (bridge?.openExerciseTrend) {
            bridge.openExerciseTrend(
              tr.dataset.programId,
              tr.dataset.sheetId,
              tr.dataset.exerciseId,
            );
            return;
          }
        });
      }

      // 6a) Muscoli dalla Libreria; se incompleti li completa Coach AI.
      const nameEl = tr.querySelector(".coach-exercise-name-text");
      const muscleRow = tr.querySelector(".coach-inline-sub");
      if (nameEl && muscleRow) {
        const primaryEl = muscleRow.querySelector("strong");
        const secondaryEl = muscleRow.querySelector("span");
        const fallbackSecondary = secondaryEl?.textContent.trim() === "Secondari"
          ? []
          : (secondaryEl?.textContent || "").split(",");
        const metadata =
          window.BarbellDivaV146Bridge?.ensureExerciseMuscles?.(
            tr.getAttribute("data-program-id"),
            tr.getAttribute("data-sheet-id"),
            tr.getAttribute("data-exercise-id"),
          ) ||
          window.BarbellDivaV146Bridge?.exerciseMuscles?.(
            nameEl.textContent.trim(),
            primaryEl?.textContent.trim() || "",
            fallbackSecondary,
          );
        if (metadata) {
          if (primaryEl) primaryEl.textContent = metadata.primary;
          if (secondaryEl) secondaryEl.textContent = metadata.secondary.length ? metadata.secondary.join(", ") : "Nessun secondario";
          muscleRow.dataset.muscleSource = metadata.source;
          muscleRow.title = metadata.source === "coach-ai"
            ? "Muscoli completati da Coach AI usando la Libreria esercizi"
            : "Muscoli dalla Libreria esercizi";
        }
      }

      // 6b) Save-check: flash verde sull'input dopo modifica (attesa 400ms)
      tr.querySelectorAll("input, select").forEach((el) => {
        if (el.dataset.schedeSaveBound) return;
        el.dataset.schedeSaveBound = "1";
        let t = null;
        const fire = () => {
          el.classList.remove("schede-just-saved");
          // trigger reflow to restart animation
          void el.offsetWidth;
          el.classList.add("schede-just-saved");
          const td = el.closest("td");
          if (td) {
            td.classList.remove("schede-cell-saved");
            void td.offsetWidth;
            td.classList.add("schede-cell-saved");
            setTimeout(() => td.classList.remove("schede-cell-saved"), 1300);
          }
          setTimeout(() => el.classList.remove("schede-just-saved"), 1300);
        };
        const onChange = () => {
          clearTimeout(t);
          t = setTimeout(fire, 350);
        };
        el.addEventListener("change", onChange);
        el.addEventListener("blur", onChange);
      });
    });

    // 7) Header giorno: estraggo durata in pill + pencil accanto al nome
    root.querySelectorAll(".coach-program-day > header").forEach((header) => {
      const dayTitle = header.querySelector(".coach-day-title");
      const small = header.querySelector(".coach-day-title small");
      if (dayTitle && !dayTitle.querySelector(".schede-v146-duration-pill")) {
        const dur = extractDuration(small ? small.textContent : "");
        if (dur) {
          const pill = document.createElement("span");
          pill.className = "schede-v146-duration-pill";
          pill.textContent = dur;
          dayTitle.appendChild(pill);
        }
      }
      // Pencil edit accanto al nome
      const nameEl = dayTitle && dayTitle.querySelector("strong");
      if (nameEl && !dayTitle.querySelector(".schede-v146-name-edit")) {
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "schede-v146-name-edit";
        editBtn.textContent = "✎";
        editBtn.title = "Rinomina scheda";
        editBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          const card = header.closest(".coach-program-day");
          const sheetId = card ? card.getAttribute("data-board-sheet") : null;
          if (sheetId && window.BarbellDivaV146Bridge?.openSheetEdit) {
            window.BarbellDivaV146Bridge.openSheetEdit(sheetId);
            return;
          }
          const trigger = header.querySelector(
            `[data-sheet-action="edit"][data-sheet-id="${sheetId}"]`,
          );
          if (trigger) trigger.click();
        });
        nameEl.after(editBtn);
      }
      if (dayTitle && small && !dayTitle.querySelector(".schede-v146-focus-pills")) {
        const focus = extractFocus(small.textContent);
        if (focus.length) {
          const wrap = document.createElement("span");
          wrap.className = "schede-v146-focus-pills";
          wrap.setAttribute("aria-label", `Gruppi principali: ${focus.join(", ")}`);
          focus.forEach((muscle) => {
            const pill = document.createElement("span");
            pill.textContent = muscle;
            wrap.appendChild(pill);
          });
          const duration = dayTitle.querySelector(".schede-v146-duration-pill");
          if (duration) dayTitle.insertBefore(wrap, duration);
          else dayTitle.appendChild(wrap);
        }
      }
    });

    // 8) Footer "+ Esercizio  + Circuito" per ogni giorno
    root.querySelectorAll(".coach-program-day").forEach((card) => {
      const table = card.querySelector(".coach-program-day-table");
      if (!table) return;
      if (card.querySelector(".schede-v146-day-footer")) return;
      const footer = document.createElement("div");
      footer.className = "schede-v146-day-footer";
      const sheetId = card.getAttribute("data-board-sheet");
      footer.innerHTML = `
        <button type="button" data-schede-add-exercise>
          <span class="plus">+</span> Esercizio
        </button>
        <button type="button" data-schede-add-circuit>
          <span class="plus">+</span> Circuito
        </button>
      `;
      footer.querySelector("[data-schede-add-exercise]").addEventListener("click", (ev) => {
        ev.stopPropagation();
        const addExercise = card.querySelector(
          `[data-program-board-add-kind="exercise"][data-sheet-id="${sheetId}"]`,
        );
        if (addExercise) addExercise.click();
      });
      footer.querySelector("[data-schede-add-circuit]").addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (window.BarbellDivaV146Bridge?.openExerciseLibrary) {
          window.BarbellDivaV146Bridge.openExerciseLibrary(sheetId, "circuit");
          return;
        }
        const addExercise = card.querySelector(
          `[data-program-board-add-kind="exercise"][data-sheet-id="${sheetId}"]`,
        );
        if (addExercise) addExercise.click();
      });
      table.after(footer);
    });

  }

  // Program list — card cliccabili (vive anche fuori dall'editor)
  function enhanceProgramList() {
    document.querySelectorAll("article.coach-program-row, .coach-program-row").forEach((card) => {
      if (card.dataset.schedeCardBound) return;
      const modifica = Array.from(card.querySelectorAll("button")).find(
        (b) => (b.textContent || "").trim() === "Modifica",
      );
      if (!modifica) return;
      card.dataset.schedeCardBound = "1";
      card.classList.add("schede-card-clickable");
      card.addEventListener("click", (ev) => {
        if (ev.target.closest("button, a, select, input, [role='button']")) return;
        modifica.click();
      });
    });
  }

  // Debounced enhancer
  let raf = null;
  function scheduleEnhance() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = null;
      document.querySelectorAll(".coach-editor-weekly").forEach(enhanceEditor);
      enhanceProgramList();
    });
  }

  // Observer sul DOM per catturare re-render (editor o lista programmi)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList" && (m.addedNodes.length || m.removedNodes.length)) {
        if (
          document.querySelector(".coach-editor-weekly") ||
          document.querySelector(".coach-program-row")
        ) {
          scheduleEnhance();
          return;
        }
      }
    }
  });

  function closeSheetEditReliably(event) {
    const button = event.target.closest(
      "#coachModalPortalHost [data-coach-modal-close]",
    );
    if (!button) return;
    const modal = button.closest(".coach-modal");
    if (
      !modal ||
      !/modifica dettagli scheda|rinomina scheda/i.test(
        modal.querySelector("h2, h3")?.textContent || "",
      )
    ) {
      return;
    }
    const bridge = window.BarbellDivaV146Bridge;
    if (!bridge?.closeModal) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    bridge.closeModal();
  }

  function boot() {
    scheduleEnhance();
    document.addEventListener("click", closeSheetEditReliably, true);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
