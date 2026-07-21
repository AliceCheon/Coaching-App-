(function (global) {
  "use strict";

  const ROUTES = Object.freeze([
    "dashboard", "programs", "program", "library", "progressions", "ai",
    "questionnaires", "questionnaire", "statistics", "archive", "diagnostics",
    "settings", "legacy"
  ]);

  const DEFAULT_FILTERS = Object.freeze({ query: "", status: "all", phase: "all", folder: "all", sort: "updated" });

  function cleanRoute(value) {
    const route = String(value || "programs").toLowerCase();
    if (route === "dashboard" || route === "legacy") return "programs";
    return ROUTES.includes(route) ? route : "programs";
  }

  function normalizeStudio(value) {
    const input = value && typeof value === "object" ? value : {};
    return {
      route: cleanRoute(input.route),
      programId: String(input.programId || ""),
      questionnaireId: String(input.questionnaireId || ""),
      filters: { ...DEFAULT_FILTERS, ...(input.filters || {}) },
      editorView: "weekly",
      sidebarOpen: false,
      folders: Array.isArray(input.folders) ? input.folders.map(String).filter(Boolean) : [],
      referenceOpen: !!input.referenceOpen,
      referenceProgramId: String(input.referenceProgramId || ""),
      infoOpen: !!input.infoOpen,
      aiOpen: !!input.aiOpen,
      programWeek: Math.max(1, Number(input.programWeek) || 1),
      lastVisitedAt: input.lastVisitedAt || null
    };
  }

  function programMetrics(programs) {
    const list = Array.isArray(programs) ? programs.filter((item) => !item?.deletedAt) : [];
    const sheets = list.flatMap((program) => (program.sheets || []).filter((item) => !item?.deletedAt));
    const exercises = sheets.flatMap((sheet) => (sheet.exercises || []).filter((item) => !item?.deletedAt));
    return {
      programs: list.length,
      active: list.filter((item) => item.status === "active").length,
      drafts: list.filter((item) => !item.status || item.status === "draft" || item.status === "available").length,
      archived: list.filter((item) => item.status === "archived").length,
      sheets: sheets.length,
      exercises: exercises.length
    };
  }

  function filterPrograms(programs, filters) {
    const f = { ...DEFAULT_FILTERS, ...(filters || {}) };
    const query = String(f.query || "").trim().toLocaleLowerCase("it");
    const filtered = (Array.isArray(programs) ? programs : []).filter((program) => {
      if (program?.deletedAt) return false;
      if (f.status !== "all" && (program.status || "draft") !== f.status) return false;
      if (f.phase !== "all" && String(program.phase || "") !== f.phase) return false;
      if (f.folder !== "all" && String(program.folder || "") !== f.folder) return false;
      const haystack = [program.name, program.phase, program.description, program.id].join(" ").toLocaleLowerCase("it");
      return !query || haystack.includes(query);
    });
    return filtered.sort((a, b) => {
      if (f.sort === "name") return String(a.name || "").localeCompare(String(b.name || ""), "it");
      if (f.sort === "status") return String(a.status || "draft").localeCompare(String(b.status || "draft"), "it");
      return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
    });
  }

  function createQuestionnaire(overrides) {
    const now = new Date().toISOString();
    return {
      id: `questionnaire-${Date.now().toString(36)}`,
      title: "Nuovo questionario",
      type: "check-in",
      active: true,
      visibility: "all",
      recurrence: "always",
      questions: [],
      createdAt: now,
      updatedAt: now,
      ...(overrides || {})
    };
  }

  function statistics(programs, sessions) {
    const metrics = programMetrics(programs);
    const history = Array.isArray(sessions) ? sessions : [];
    const completed = history.filter((item) => !item?.deletedAt);
    const totalVolume = completed.reduce((sum, session) => sum + (Number(session.total) || 0), 0);
    const byProgram = (Array.isArray(programs) ? programs : []).filter((program) => !program?.deletedAt).map((program) => ({
      id: program.id,
      name: program.name || "Programma",
      sheets: (program.sheets || []).filter((item) => !item?.deletedAt).length,
      exercises: (program.sheets || []).reduce((sum, sheet) => sum + (sheet.exercises || []).filter((item) => !item?.deletedAt).length, 0)
    }));
    return { ...metrics, completed: completed.length, totalVolume, byProgram };
  }

  global.BarbellDivaCoachStudio = Object.freeze({
    version: "19.6",
    routes: ROUTES,
    cleanRoute,
    normalizeStudio,
    filterPrograms,
    programMetrics,
    createQuestionnaire,
    statistics
  });
})(window);
