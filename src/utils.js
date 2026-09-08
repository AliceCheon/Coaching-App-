// Utility condivise per Barbell Diva
// Estratte dai file: coach-ai-engine-2.js, coach-ai3-programming.js,
// knowledge-graph.js, decision-engine.js, master-exercise-library.js

export const list = (v) => Array.isArray(v) ? v.filter(Boolean) : v == null || v === "" ? [] : [v];

export const num = (v) => v !== "" && v != null && Number.isFinite(Number(v)) ? Number(v) : null;

export const clone = (v) => v == null ? v : JSON.parse(JSON.stringify(v));

export const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export function stableHash(value) {
  let h = 2166136261;
  const t = JSON.stringify(value);
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function hash(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export const text = (value, fallback = "") => typeof value === "string" ? value.trim() : fallback;

export const numberOrNull = (value) => Number.isFinite(Number(value)) && value !== "" && value != null ? Number(value) : null;

export const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const uniq = (values) => [...new Set(list(values).map(v => String(v).trim()).filter(Boolean))];

export const clamp = (v, min = 0, max = 5) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0;
};

export const maxReps = (value) => {
  const hits = String(value || "").match(/\d+(?:[.,]\d+)?/g);
  return hits?.length ? Math.max(...hits.map(v => Number(v.replace(",", ".")))) : null;
};

export const numericValues = (values) => list(values).map(num).filter(v => v != null);

export const percentChange = (first, last) => first && last ? Number(((last - first) / first * 100).toFixed(1)) : null;

export const dateValue = (value) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

export const semanticValue = (value) => {
  if (Array.isArray(value)) return value.map(semanticValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter(key => !["updatedAt", "createdAt", "generatedAt", "lastVisitedAt"].includes(key))
      .map(key => [key, semanticValue(value[key])])
  );
};

export const semanticHash = (value) => stableHash(semanticValue(value));

export const nodeId = (type, id) => `${type}:${String(id || "unknown")}`;