// FASE 2.12 — Coach AI: stato (preferenze ignore + log decisioni unico).
// Estratto da src/app-main.js mantenendo lo stesso comportamento riga per riga.
// Convenzione moduli (come knowledge-graph.js): IIFE che si espone su
// window.BarbellDivaCoachAiState e riceve le dipendenze vive da app-main via
// ctx. `state` NON viene copiato: app-main lo riassegna (merge cloud, restore),
// quindi passa ctx.getState() che restituisce sempre il riferimento corrente.
(function (root) {
  "use strict";
  const api = {
    // Chiave di ignore: "once" legata al fingerprint dell'analisi, "variant" legata all'identità esercizio.
    coachAiIgnoreKey(item, mode, fingerprint, ctx) {
      item = item || {}; mode = mode || "once"; fingerprint = fingerprint || "";
      const identity = item.identityKey || [item.programId || ctx.getSelectedProgramId(), item.sheetId || "", item.exerciseId || ""].join("|");
      return mode === "once" ? `once:${fingerprint}:${item.id}` : `variant:${identity}`;
    },
    // Applica le preferenze di ignore all'analisi e fonde gli insight duplicati.
    coachAiApplyIgnorePreferences(result, ctx) {
      const state = ctx.getState();
      const preferences = state.coachAi3?.ignorePreferences || {}, resolved = state.coachAi3?.resolvedPreferences || {}, fingerprint = result.knowledgeFingerprint || "", hidden = new Set();
      const selectedProgram = ctx.programRepository.getProgramById(ctx.getSelectedProgramId());
      const currentProgramHash = selectedProgram && root.BarbellDivaCoachAI3?.hash ? root.BarbellDivaCoachAI3.hash(selectedProgram) : "";
      (result.insights || []).forEach((item) => {
        if (preferences[api.coachAiIgnoreKey(item, "once", fingerprint, ctx)] || preferences[api.coachAiIgnoreKey(item, "variant", fingerprint, ctx)]) hidden.add(item.id);
        const resolution = Object.values(resolved).find((entry) => entry.programId === item.programId && entry.exerciseId === item.exerciseId && entry.programFingerprint === currentProgramHash);
        if (resolution) hidden.add(item.id);
      });
      const unique = new Map(), general = [];
      (result.insights || []).filter((item) => item.scope !== "diagnostics" && !hidden.has(item.id)).forEach((item) => { const key = item.exerciseId || item.identityKey; if (!key) { general.push(item); return; } const previous = unique.get(key); if (!previous) { unique.set(key, item); return; } const keep = ctx.coachAiPriorityValue(item.priority) > ctx.coachAiPriorityValue(previous.priority) ? item : previous, other = keep === item ? previous : item; unique.set(key, { ...keep, mergedCount: Number(previous.mergedCount || 1) + Number(item.mergedCount || 1), description: [keep.description, other.description].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index).join(" "), reason: [keep.reason, other.reason].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index).join(" "), data: [...(keep.data || []), ...(other.data || [])].filter((value, index, array) => array.findIndex((candidate) => candidate.label === value.label && String(candidate.value) === String(value.value)) === index), actions: [...(keep.actions || []), ...(other.actions || [])].filter((value, index, array) => array.findIndex((candidate) => candidate.type === value.type) === index) }); });
      result.insights = [...unique.values(), ...general];
      result.decisions = (result.decisions || []).filter((item) => item.scope !== "diagnostics" && !hidden.has(item.id) && !hidden.has(item.sourceInsightId));
      return result;
    },
    // Registra una proposta/decisione nel log unico (FASE 1.10): `decisions` è
    // il canone, `history` resta specchio retrocompatibile per snapshot v10.
    coachAi3HistoryRecord(entry, ctx) {
      const state = ctx.getState();
      state.coachAi3 = state.coachAi3 || { version: root.BarbellDivaCoachAI3.VERSION, history: [] };
      if (entry?.status === "accepted" && ctx.coachProgramUi.ai3Preview) entry = { ...entry, ...ctx.coachAi3Snapshot(ctx.coachProgramUi.ai3Preview, "accepted") };
      state.coachAi3.history = root.BarbellDivaCoachAI3.record(state.coachAi3.history, entry);
      // FASE 1.10: `decisions` è il log decisioni unico (canone); `history`
      // resta come specchio retrocompatibile per gli snapshot letti da
      // versioni precedenti dell'app (es. altro dispositivo non aggiornato).
      state.coachAi3.decisions = root.BarbellDivaCoachAI3.record(Array.isArray(state.coachAi3.decisions) ? state.coachAi3.decisions : [], { type: "proposal", ...entry }).slice(0, 500);
      state.coachAi3.lastProposalAt = new Date().toISOString();
    }
  };
  root.BarbellDivaCoachAiState = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
