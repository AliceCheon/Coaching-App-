// Barbell Diva — calcolatore dischi + rampa di riscaldamento (Fase 9b).
// Modulo autonomo e testabile: nessuna dipendenza dallo stato dell'app.
(function (root) {
  "use strict";

  const DEFAULT_BAR = 20;
  const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

  function platesFor(totalKg, barKg, plateList) {
    const total = Number(totalKg);
    const bar = Number(barKg) || DEFAULT_BAR;
    const plates = (Array.isArray(plateList) && plateList.length ? plateList.slice() : DEFAULT_PLATES.slice()).sort((a, b) => b - a);
    if (!Number.isFinite(total) || total <= 0) return { ok: false, perSide: [], bar, achievable: bar, message: "Inserisci un peso valido." };
    if (total < bar) return { ok: false, perSide: [], bar, achievable: bar, message: `Il peso è inferiore al bilanciere (${bar} kg).` };
    let remaining = (total - bar) / 2;
    const perSide = [];
    plates.forEach((plate) => { while (remaining >= plate - 1e-9) { perSide.push(plate); remaining -= plate; } });
    const achievable = bar + perSide.reduce((sum, plate) => sum + plate, 0) * 2;
    const exact = Math.abs(achievable - total) < 0.01;
    return {
      ok: exact, perSide, bar, achievable: Math.round(achievable * 100) / 100,
      message: exact ? "" : `Con i dischi disponibili si arriva a ${Math.round(achievable * 100) / 100} kg.`
    };
  }

  function warmupSets(workingKg, barKg) {
    const working = Number(workingKg);
    const bar = Number(barKg) || DEFAULT_BAR;
    if (!Number.isFinite(working) || working <= 0) return [];
    const steps = [{ percent: 40, reps: 8 }, { percent: 60, reps: 5 }, { percent: 75, reps: 3 }, { percent: 88, reps: 2 }];
    return steps
      .map((step) => ({ percent: step.percent, reps: step.reps, kg: Math.max(bar, Math.round((working * step.percent / 100) / 2) * 2) }))
      .filter((step) => step.kg < working);
  }

  function platesLabel(perSide) {
    const counts = new Map();
    perSide.forEach((plate) => counts.set(plate, (counts.get(plate) || 0) + 1));
    return [...counts.entries()].map(([plate, count]) => `${plate}×${count}`).join("  ");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function renderPanel(workingKg, barKg) {
    const calc = platesFor(workingKg, barKg);
    const warm = warmupSets(workingKg, barKg);
    const platesLine = calc.ok || calc.perSide.length
      ? `<div class="v147-plates-row"><strong>${calc.perSide.length ? platesLabel(calc.perSide) : "Solo bilanciere"}</strong><span>per lato${calc.ok ? "" : ` (≈ ${calc.achievable} kg)`}</span></div>`
      : "";
    const warmLine = warm.length
      ? `<div class="v147-warmup">${warm.map((step) => `<div><span>${step.percent}%</span><strong>${step.kg} kg</strong><small>× ${step.reps}</small></div>`).join("")}</div>`
      : `<p class="micro-copy">Inserisci un carico di lavoro per generare la rampa.</p>`;
    return `<h3>Dischi &amp; riscaldamento</h3><p class="micro-copy">Bilanciere ${calc.bar} kg · dischi 25/20/15/10/5/2.5/1.25 kg per lato.</p>${platesLine}${calc.message ? `<p class="micro-copy">${escapeHtml(calc.message)}</p>` : ""}<h4>Riscaldamento</h4>${warmLine}`;
  }

  root.BarbellDivaPlates = Object.freeze({ DEFAULT_BAR, DEFAULT_PLATES, platesFor, warmupSets, platesLabel, renderPanel });
})(typeof window !== "undefined" ? window : globalThis);
