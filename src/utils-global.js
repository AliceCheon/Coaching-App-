// Espone le utility condivise come globali per gli script non-module
// Caricare PRIMA degli altri script in index.html
(function (root) {
  "use strict";

  const list = (v) => Array.isArray(v) ? v.filter(Boolean) : v == null || v === "" ? [] : [v];
  const num = (v) => v !== "" && v != null && Number.isFinite(Number(v)) ? Number(v) : null;
  const clone = (v) => v == null ? v : JSON.parse(JSON.stringify(v));
  const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

  function stableHash(value) {
    let h = 2166136261;
    const t = JSON.stringify(value);
    for (let i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function hash(value) {
    let h = 2166136261;
    for (const ch of String(value)) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  const text = (value, fallback = "") => typeof value === "string" ? value.trim() : fallback;
  const numberOrNull = (value) => Number.isFinite(Number(value)) && value !== "" && value != null ? Number(value) : null;
  const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const uniq = (values) => [...new Set(list(values).map(v => String(v).trim()).filter(Boolean))];
  const clamp = (v, min = 0, max = 5) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0;
  };
  const maxReps = (value) => {
    const hits = String(value || "").match(/\d+(?:[.,]\d+)?/g);
    return hits?.length ? Math.max(...hits.map(v => Number(v.replace(",", ".")))) : null;
  };
  const numericValues = (values) => list(values).map(num).filter(v => v != null);
  const percentChange = (first, last) => first && last ? Number(((last - first) / first * 100).toFixed(1)) : null;
  const dateValue = (value) => {
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const semanticValue = (value) => {
    if (Array.isArray(value)) return value.map(semanticValue);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter(key => !["updatedAt", "createdAt", "generatedAt", "lastVisitedAt"].includes(key))
        .map(key => [key, semanticValue(value[key])])
    );
  };
  const semanticHash = (value) => stableHash(semanticValue(value));
  const nodeId = (type, id) => `${type}:${String(id || "unknown")}`;

  root.BarbellDivaUtils = Object.freeze({
    list,
    num,
    clone,
    norm,
    stableHash,
    hash,
    text,
    numberOrNull,
    id,
    uniq,
    clamp,
    maxReps,
    numericValues,
    percentChange,
    dateValue,
    semanticValue,
    semanticHash,
    nodeId
  });
})(typeof window !== "undefined" ? window : globalThis);