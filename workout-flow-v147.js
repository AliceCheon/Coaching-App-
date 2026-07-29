(function () {
  "use strict";

  if (window.__barbellDivaWorkoutV147Installed) return;
  window.__barbellDivaWorkoutV147Installed = true;

  const VERSION = "147.0";
  const originalTrainingHtml = trainingHtml;
  const originalBindScreen = bindScreen;
  let localSaveTimer = 0;

  function scheduleLocalSave(immediate = false) {
    window.clearTimeout(localSaveTimer);
    if (immediate) {
      saveState({ cloud: false, immediate: true });
      return;
    }
    localSaveTimer = window.setTimeout(() => saveState({ cloud: false }), 180);
  }

  function activeSession(context = currentTrainingContext()) {
    const active = state.training?.activeWorkout;
    if (!active || !context?.session) return null;
    const sameContext =
      String(active.date || "") === String(context.date || "") &&
      String(active.sessionCode || "") === String(context.session.code || "") &&
      Number(active.week || 0) === Number(context.week || 0);
    return sameContext && ["active", "paused"].includes(active.status) ? active : null;
  }

  function exerciseKey(exercise, index) {
    return `${index}:${normalizeExerciseName(exercise?.name || `exercise-${index}`)}`;
  }

  function defaultRir(exercise, setIndex) {
    const values = String(exercise?.rir || "")
      .split(/[,/|]/)
      .map((value) => value.trim())
      .filter(Boolean);
    return values[setIndex] || values[values.length - 1] || "";
  }

  function ensureExerciseLog(active, context, exercise, index) {
    active.logs = active.logs || {};
    const key = exerciseKey(exercise, index);
    const count = setCountFor(exercise);
    const targets = repTargetsFor(exercise);
    const loads = draftSetsFor(context, exercise);
    const current = active.logs[key] || {};
    current.kg = Array.from({ length: count }, (_, setIndex) => current.kg?.[setIndex] ?? loads[setIndex] ?? "");
    current.reps = Array.from({ length: count }, (_, setIndex) => current.reps?.[setIndex] ?? targets[setIndex] ?? "");
    current.rir = Array.from({ length: count }, (_, setIndex) => current.rir?.[setIndex] ?? defaultRir(exercise, setIndex));
    active.logs[key] = current;
    return current;
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function uniqueMuscles(session) {
    const muscles = [];
    const add = (value) => {
      String(value || "")
        .split(/[,/|]/)
        .map((part) => titleCase(part))
        .filter(Boolean)
        .forEach((part) => {
          if (!muscles.some((known) => normalizeExerciseName(known) === normalizeExerciseName(part))) muscles.push(part);
        });
    };
    add(session?.focus);
    (session?.exercises || []).forEach((exercise) => add(exercise.muscle || exercise.som));
    return muscles.slice(0, 4);
  }

  function secondaryMuscles(exercise) {
    const raw =
      exercise?.metadata?.secondaryMuscles ||
      exercise?.secondaryMuscles ||
      exercise?.prescription?.secondaryMuscles ||
      [];
    return (Array.isArray(raw) ? raw : String(raw || "").split(","))
      .map((value) => titleCase(value))
      .filter(Boolean);
  }

  function estimatedMinutes(session) {
    const exercises = session?.exercises || [];
    const totalSets = exercises.reduce((sum, exercise) => sum + setCountFor(exercise), 0);
    return Math.max(18, Math.round(totalSets * 1.75 + exercises.length * 2));
  }

  function modeControlsHtml(context) {
    const phases = availablePhases();
    const phaseSheets = sessionsForPhase(context.phase);
    const maxWeek = Math.max(1, Number(state.profile?.phaseLength) || 1, ...phaseSheets.map((item) => Number(item.week) || 0));
    return `
      <div class="v147-mode-row" aria-label="Modalità workout">
        <span>Modalità</span>
        <div class="v147-segmented">
          <button type="button" class="${context.isManual ? "" : "is-active"}" data-v147-mode="auto">Automatica</button>
          <button type="button" class="${context.isManual ? "is-active" : ""}" data-v147-mode="manual">Manuale</button>
        </div>
      </div>
      ${context.isManual ? `
        <div class="v147-manual-controls">
          <label>Fase
            <select data-training-context="phase">
              ${phases.map((phase) => `<option value="${escapeHtml(phase)}" ${phase === context.phase ? "selected" : ""}>${escapeHtml(displayLabel(phase))}</option>`).join("")}
            </select>
          </label>
          <label>Settimana
            <select data-training-context="week">
              ${Array.from({ length: maxWeek }, (_, index) => `<option value="${index + 1}" ${Number(context.week) === index + 1 ? "selected" : ""}>Settimana ${index + 1}</option>`).join("")}
            </select>
          </label>
          <label>Scheda
            <select data-training-context="session">
              ${phaseSheets.map((sheet) => `<option value="${escapeHtml(sheet.code)}" ${sheet.code === context.session?.code ? "selected" : ""}>${escapeHtml(sheet.code)} · ${escapeHtml(sheet.name || sheet.focus)}</option>`).join("")}
            </select>
          </label>
        </div>
      ` : ""}
    `;
  }

  function preWorkoutHtml(context) {
    const session = context.session;
    if (!session) {
      return `<section class="v147-empty card"><h2>Nessuna scheda disponibile</h2><p>Seleziona una fase o una scheda manuale per preparare il workout.</p>${modeControlsHtml(context)}</section>`;
    }
    const exercises = session.exercises || [];
    const muscles = uniqueMuscles(session);
    return `
      <div class="v147-workout v147-pre">
        <header class="v147-title">
          <div><span class="section-eyebrow">Barbell Diva Workout</span><h2>Workout del giorno</h2></div>
          <label class="v147-date"><span>Data</span><input type="date" id="trainingDate" value="${escapeHtml(context.date)}"></label>
        </header>

        <section class="v147-context-strip">
          <div><small>Oggi</small><strong>${escapeHtml(formatDateLabel(context.date))}</strong></div>
          <div><small>Fase</small><strong>${escapeHtml(displayLabel(context.phase))}</strong></div>
          <div><small>Settimana</small><strong>${context.week}</strong></div>
          <div><small>Scheda</small><strong>${escapeHtml(session.code || session.name)}</strong></div>
        </section>

        ${modeControlsHtml(context)}

        <section class="v147-preview-card card">
          <div class="v147-preview-copy">
            <span class="section-eyebrow">Oggi ti aspetta</span>
            <h3>${escapeHtml(displayLabel(session.name || session.code))}</h3>
            <p>${exercises.length} esercizi · circa ${estimatedMinutes(session)} min</p>
            <div class="v147-muscle-chips">${muscles.map((muscle) => `<span>${escapeHtml(muscle)}</span>`).join("")}</div>
          </div>
          <div class="v147-exercise-preview">
            ${exercises.slice(0, 5).map((exercise, index) => `
              <div><b>${index + 1}</b><span>${escapeHtml(displayExerciseName(exercise.name))}</span><small>${escapeHtml(displayLabel(exercise.sets || "--"))} serie</small></div>
            `).join("")}
            ${exercises.length > 5 ? `<p>+ ${exercises.length - 5} esercizi</p>` : ""}
          </div>
          <div class="v147-preview-footer">
            <span>↺ Dati precedenti pronti · ultimo programma</span>
            <button type="button" class="v147-primary" data-v147-start>▶ INIZIA WORKOUT</button>
          </div>
        </section>
      </div>
    `;
  }

  function historySets(exercise, sessionCode) {
    const latest = exerciseHistory(exercise, 1, sessionCode)[0];
    if (!latest) return { source: "Nessuno storico", rows: [] };
    let rows = Array.isArray(latest.completedSets) ? latest.completedSets : [];
    if (!rows.length && Array.isArray(latest.setValues)) {
      const reps = repTargetsFor(exercise);
      rows = latest.setValues.map((kg, index) => ({ kg, reps: reps[index] || exercise.reps, rir: latest.rir || exercise.rir || "" }));
    }
    if (!rows.length && (latest.kg || latest.value)) rows = [{ kg: latest.kg || latest.value, reps: latest.reps || exercise.reps, rir: latest.rir || exercise.rir || "" }];
    return {
      source: Number(currentTrainingContext().week) === 1 ? "Ultimo programma" : "Ultima seduta",
      rows: rows.slice(0, 5)
    };
  }

  function completionSnapshot(context, active) {
    const exercises = context.session?.exercises || [];
    let totalSets = 0;
    let completedSets = 0;
    exercises.forEach((exercise) => {
      const values = draftSetsFor(context, exercise);
      totalSets += setCountFor(exercise);
      values.forEach((value, setIndex) => {
        if (setIsDone(context, exercise, setIndex, value)) completedSets += 1;
      });
    });
    return {
      totalSets,
      completedSets,
      percent: totalSets ? Math.round((completedSets / totalSets) * 100) : 0,
      exerciseIndex: Math.min(exercises.length - 1, Math.max(0, Number(active.currentExercise) || 0))
    };
  }

  function outlineHtml(context, active, snapshot) {
    const exercises = context.session.exercises || [];
    return `
      <div class="v147-outline-backdrop ${active.outlineOpen ? "is-open" : ""}" data-v147-outline-close></div>
      <aside class="v147-outline ${active.outlineOpen ? "is-open" : ""}" aria-label="Scaletta workout" aria-hidden="${active.outlineOpen ? "false" : "true"}">
        <header><div><span class="section-eyebrow">Workout</span><h3>Scaletta workout</h3></div><button type="button" data-v147-outline-close aria-label="Chiudi scaletta">×</button></header>
        <strong>${snapshot.exerciseIndex + 1} di ${exercises.length}</strong>
        <div class="v147-outline-progress"><span style="width:${snapshot.percent}%"></span></div>
        <nav>
          ${exercises.map((exercise, index) => {
            const values = draftSetsFor(context, exercise);
            const done = values.length > 0 && values.every((value, setIndex) => setIsDone(context, exercise, setIndex, value));
            const current = index === snapshot.exerciseIndex;
            return `<button type="button" class="${done ? "is-done" : ""} ${current ? "is-current" : ""}" data-v147-jump="${index}">
              <b>${done ? "✓" : index + 1}</b><span>${escapeHtml(displayExerciseName(exercise.name))}</span><em>›</em>
            </button>`;
          }).join("")}
        </nav>
        <footer><span><i class="done"></i> Completato</span><span><i class="current"></i> In corso</span><span><i></i> Da fare</span></footer>
      </aside>
    `;
  }

  function activeWorkoutHtml(context, active) {
    const exercises = context.session.exercises || [];
    const snapshot = completionSnapshot(context, active);
    active.currentExercise = snapshot.exerciseIndex;
    const exercise = exercises[snapshot.exerciseIndex];
    if (!exercise) return preWorkoutHtml(context);
    const log = ensureExerciseLog(active, context, exercise, snapshot.exerciseIndex);
    const values = draftSetsFor(context, exercise);
    const primary = titleCase(exercise.muscle || exercise.som || context.session.focus || "Da classificare");
    const secondary = secondaryMuscles(exercise);
    const history = historySets(exercise, context.session.code);
    const latestNotes = exerciseNotes(exercise, 2);
    const currentNote = draftNoteFor(context, exercise);
    const paused = active.status === "paused";

    return `
      <div class="v147-workout v147-active ${paused ? "is-paused" : ""}">
        ${outlineHtml(context, active, snapshot)}
        <header class="v147-active-head">
          <button type="button" class="v147-outline-button" data-v147-outline-open>☰ <span>Scaletta workout</span></button>
          <div class="v147-active-title"><span class="section-eyebrow">Workout in corso</span><strong>${escapeHtml(context.session.code)} · Settimana ${context.week}</strong></div>
          <div class="v147-head-actions">
            <button type="button" data-v147-pause>${paused ? "▶ Riprendi" : "Ⅱ Pausa"}</button>
            <button type="button" class="danger" data-v147-finish>■ Termina</button>
          </div>
        </header>
        <div class="v147-global-progress"><span style="width:${snapshot.percent}%"></span><small>Esercizio ${snapshot.exerciseIndex + 1} di ${exercises.length} · ${snapshot.completedSets}/${snapshot.totalSets} serie</small></div>

        <div class="v147-active-grid">
          <main class="v147-execution card">
            <div class="v147-exercise-head">
              <div><span class="section-eyebrow">Esercizio ${snapshot.exerciseIndex + 1}</span><h2>${escapeHtml(displayExerciseName(exercise.name))}</h2></div>
              <div class="v147-muscle-chips"><span>${escapeHtml(primary)}</span>${secondary.length ? `<span class="secondary">Secondari: ${escapeHtml(secondary.join(", "))}</span>` : ""}</div>
            </div>

            <div class="v147-coach-cues">
              <article><span>SOM</span><strong>${escapeHtml(displayLabel(exercise.tempo || exercise.metadata?.note2 || "Non indicato"))}</strong></article>
              <article><span>NOTA COACH</span><strong>${escapeHtml(displayLabel(exercise.note || "Nessuna nota coach"))}</strong></article>
            </div>

            <div class="v147-set-table" role="table" aria-label="Serie dell'esercizio">
              <div class="v147-set-header" role="row"><span>SERIE</span><span>KG</span><span>RIPETIZIONI</span><span>RIR</span><span>FATTA</span></div>
              ${values.map((value, setIndex) => {
                const done = setIsDone(context, exercise, setIndex, value);
                const selected = Number(active.currentSet || 0) === setIndex;
                return `<div class="v147-set-row ${done ? "is-done" : ""} ${selected ? "is-selected" : ""}" role="row" data-v147-set-row="${setIndex}">
                  <strong>${setIndex + 1}</strong>
                  <input type="text" inputmode="decimal" value="${escapeHtml(log.kg[setIndex] ?? value)}" data-v147-set-field="kg" data-set-index="${setIndex}" aria-label="Kg serie ${setIndex + 1}">
                  <input type="text" inputmode="numeric" value="${escapeHtml(log.reps[setIndex])}" data-v147-set-field="reps" data-set-index="${setIndex}" aria-label="Ripetizioni serie ${setIndex + 1}">
                  <input type="text" inputmode="decimal" value="${escapeHtml(log.rir[setIndex])}" data-v147-set-field="rir" data-set-index="${setIndex}" aria-label="RIR serie ${setIndex + 1}">
                  <button type="button" class="v147-set-check ${done ? "is-done" : ""}" data-v147-set-check="${setIndex}" aria-pressed="${done}">${done ? "✓" : ""}</button>
                </div>`;
              }).join("")}
            </div>
            <button type="button" class="v147-primary v147-confirm" data-v147-confirm-set>CONFERMA SERIE</button>
          </main>

          <aside class="v147-side">
            <section class="card v147-history">
              <header><h3>STORICO</h3><span>${escapeHtml(history.source)}</span></header>
              ${history.rows.length ? history.rows.map((row, index) => `<div><b>Set ${index + 1}</b><span>${escapeHtml(row.kg ?? "--")} kg × ${escapeHtml(row.reps ?? "--")} · RIR ${escapeHtml(row.rir ?? "--")}</span></div>`).join("") : `<p>Nessuno storico per questo esercizio.</p>`}
            </section>
            <section class="card v147-personal-notes">
              <h3>NOTE PERSONALI</h3>
              <textarea data-v147-note placeholder="Sensazioni, setup o promemoria...">${escapeHtml(currentNote)}</textarea>
              ${latestNotes.length ? `<details><summary>Ultime note</summary>${latestNotes.map((note) => `<p><b>${escapeHtml(note.date)}</b> ${escapeHtml(note.text)}</p>`).join("")}</details>` : ""}
            </section>
          </aside>
        </div>

        <footer class="v147-workout-nav">
          <button type="button" data-v147-previous ${snapshot.exerciseIndex === 0 ? "disabled" : ""}>← Esercizio precedente</button>
          <button type="button" class="v147-primary" data-v147-next>${snapshot.exerciseIndex === exercises.length - 1 ? "Riepilogo workout" : "Prossimo esercizio →"}</button>
        </footer>
      </div>
    `;
  }

  function workoutHtml() {
    const context = currentTrainingContext();
    const active = activeSession(context);
    return active ? activeWorkoutHtml(context, active) : preWorkoutHtml(context);
  }

  function startWorkout() {
    const context = currentTrainingContext();
    if (!context.session) return;
    state.training.activeWorkout = {
      version: VERSION,
      id: `workout-${Date.now()}`,
      status: "active",
      date: context.date,
      phase: context.phase,
      week: context.week,
      sessionCode: context.session.code,
      sessionId: context.session.id || "",
      currentExercise: 0,
      currentSet: 0,
      outlineOpen: false,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: {}
    };
    context.session.exercises.forEach((exercise, index) => ensureExerciseLog(state.training.activeWorkout, context, exercise, index));
    scheduleLocalSave(true);
    renderTrainingOnly();
    showToast("Workout iniziato. La sessione resta salvata anche se chiudi l'app.");
  }

  function updateField(input) {
    const context = currentTrainingContext();
    const active = activeSession(context);
    if (!active) return;
    const exerciseIndex = Math.max(0, Number(active.currentExercise) || 0);
    const exercise = context.session.exercises[exerciseIndex];
    const setIndex = Number(input.dataset.setIndex);
    const log = ensureExerciseLog(active, context, exercise, exerciseIndex);
    const field = input.dataset.v147SetField;
    log[field][setIndex] = input.value;
    active.currentSet = setIndex;
    active.updatedAt = new Date().toISOString();
    if (field === "kg") {
      const values = draftSetsFor(context, exercise);
      values[setIndex] = input.value;
      state.training.draft[draftKey(context, exercise)] = values;
      if (!String(input.value || "").trim()) state.training.setDone[setDoneKey(context, exercise, setIndex)] = false;
    }
    document.querySelectorAll("[data-v147-set-row]").forEach((row) => row.classList.toggle("is-selected", Number(row.dataset.v147SetRow) === setIndex));
    scheduleLocalSave();
  }

  function toggleSet(setIndex, forceDone) {
    const context = currentTrainingContext();
    const active = activeSession(context);
    if (!active) return;
    const exerciseIndex = Math.max(0, Number(active.currentExercise) || 0);
    const exercise = context.session.exercises[exerciseIndex];
    const values = draftSetsFor(context, exercise);
    const key = setDoneKey(context, exercise, setIndex);
    const done = forceDone == null ? !setIsDone(context, exercise, setIndex, values[setIndex]) : !!forceDone;
    state.training.setDone[key] = done;
    active.currentSet = done ? Math.min(values.length - 1, setIndex + 1) : setIndex;
    active.updatedAt = new Date().toISOString();
    scheduleLocalSave(true);
    renderTrainingOnly();
  }

  async function finishWorkout() {
    const context = currentTrainingContext();
    const active = activeSession(context);
    if (!active) return;
    const snapshot = completionSnapshot(context, active);
    const message = snapshot.completedSets < snapshot.totalSets
      ? `Hai completato ${snapshot.completedSets} serie su ${snapshot.totalSets}. Salvare comunque il workout nel Logbook?`
      : "Workout completato! Salvarlo nel Logbook?";
    if (!window.confirm(message)) return;
    const saved = await saveWorkoutSession();
    if (saved) {
      state.training.activeWorkout = null;
      scheduleLocalSave(true);
      renderTrainingOnly();
    }
  }

  function bindWorkout() {
    const root = document.querySelector(".v147-workout");
    const running = !!root?.classList.contains("v147-active");
    document.body.classList.toggle("workout-v147-running", running);
    document.body.classList.toggle("workout-v147-screen", activeScreen === "training");
    if (!root) return;

    root.querySelector("[data-v147-start]")?.addEventListener("click", startWorkout);
    root.querySelectorAll("[data-v147-mode]").forEach((button) => button.addEventListener("click", () => {
      state.training.contextMode = button.dataset.v147Mode;
      state.training.sessionName = button.dataset.v147Mode === "manual" ? (state.training.manualSessionCode || "") : "auto";
      scheduleLocalSave(true);
      renderTrainingOnly();
    }));

    root.querySelector("[data-v147-outline-open]")?.addEventListener("click", () => {
      const active = activeSession();
      if (!active) return;
      active.outlineOpen = true;
      scheduleLocalSave();
      renderTrainingOnly();
    });
    root.querySelectorAll("[data-v147-outline-close]").forEach((button) => button.addEventListener("click", () => {
      const active = activeSession();
      if (!active) return;
      active.outlineOpen = false;
      scheduleLocalSave();
      renderTrainingOnly();
    }));
    root.querySelectorAll("[data-v147-jump]").forEach((button) => button.addEventListener("click", () => {
      const active = activeSession();
      if (!active) return;
      active.currentExercise = Number(button.dataset.v147Jump) || 0;
      active.currentSet = 0;
      active.outlineOpen = false;
      scheduleLocalSave(true);
      renderTrainingOnly();
    }));

    root.querySelectorAll("[data-v147-set-field]").forEach((input) => {
      input.addEventListener("focus", () => updateField(input));
      input.addEventListener("input", () => updateField(input));
    });
    root.querySelectorAll("[data-v147-set-check]").forEach((button) => button.addEventListener("click", () => toggleSet(Number(button.dataset.v147SetCheck))));
    root.querySelector("[data-v147-confirm-set]")?.addEventListener("click", () => {
      const active = activeSession();
      if (!active) return;
      toggleSet(Number(active.currentSet) || 0, true);
    });
    root.querySelector("[data-v147-note]")?.addEventListener("input", (event) => {
      const context = currentTrainingContext();
      const active = activeSession(context);
      if (!active) return;
      const exercise = context.session.exercises[Number(active.currentExercise) || 0];
      state.training.noteDraft[draftNoteKey(context, exercise)] = event.target.value;
      active.updatedAt = new Date().toISOString();
      scheduleLocalSave();
    });

    root.querySelector("[data-v147-previous]")?.addEventListener("click", () => {
      const active = activeSession();
      if (!active) return;
      active.currentExercise = Math.max(0, Number(active.currentExercise || 0) - 1);
      active.currentSet = 0;
      scheduleLocalSave(true);
      renderTrainingOnly();
    });
    root.querySelector("[data-v147-next]")?.addEventListener("click", () => {
      const context = currentTrainingContext();
      const active = activeSession(context);
      if (!active) return;
      if (Number(active.currentExercise || 0) >= context.session.exercises.length - 1) {
        finishWorkout();
        return;
      }
      active.currentExercise = Number(active.currentExercise || 0) + 1;
      active.currentSet = 0;
      scheduleLocalSave(true);
      renderTrainingOnly();
    });
    root.querySelector("[data-v147-pause]")?.addEventListener("click", () => {
      const active = activeSession();
      if (!active) return;
      active.status = active.status === "paused" ? "active" : "paused";
      active.updatedAt = new Date().toISOString();
      scheduleLocalSave(true);
      renderTrainingOnly();
      showToast(active.status === "paused" ? "Workout in pausa e salvato." : "Workout ripreso.");
    });
    root.querySelector("[data-v147-finish]")?.addEventListener("click", finishWorkout);
  }

  window.BarbellDivaWorkoutV147 = {
    version: VERSION,
    completedSetsFor(exercise, context) {
      const active = activeSession(context);
      if (!active) return [];
      const index = context.session.exercises.findIndex((item) => normalizeExerciseName(item.name) === normalizeExerciseName(exercise.name));
      if (index < 0) return [];
      const log = ensureExerciseLog(active, context, exercise, index);
      return log.kg.map((kg, setIndex) => ({
        kg: number(String(kg || "").replace(",", "."), null),
        reps: number(String(log.reps[setIndex] || "").replace(",", "."), null),
        rir: number(String(log.rir[setIndex] || "").replace(",", "."), null),
        rpe: null,
        completed: setIsDone(context, exercise, setIndex, kg)
      })).filter((set) => Number.isFinite(set.kg));
    }
  };

  trainingHtml = workoutHtml;
  bindScreen = function () {
    originalBindScreen();
    bindWorkout();
  };

  if (activeScreen === "training") renderTrainingOnly();
})();
