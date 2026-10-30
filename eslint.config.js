// ESLint 9 (flat config) — controlli di igiene mirati.
// Non usiamo "eslint:recommended": il codice è legacy e i dati incorporati
// genererebbero migliaia di segnalazioni inutili. Ci limitiamo alle regole che
// intercettano errori reali (debugger, eval, chiavi duplicate, codice irraggiungibile).
export default [
  {
    ignores: ["node_modules/**", "docs/**", "**/*.min.js"]
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        window: "readonly", document: "readonly", navigator: "readonly", localStorage: "readonly",
        sessionStorage: "readonly", indexedDB: "readonly", caches: "readonly", fetch: "readonly",
        console: "readonly", setTimeout: "readonly", clearTimeout: "readonly",
        setInterval: "readonly", clearInterval: "readonly", queueMicrotask: "readonly",
        requestAnimationFrame: "readonly", cancelAnimationFrame: "readonly",
        performance: "readonly", location: "readonly", history: "readonly", screen: "readonly",
        Blob: "readonly", File: "readonly", FileReader: "readonly", URL: "readonly", URLSearchParams: "readonly",
        Image: "readonly", Audio: "readonly", matchMedia: "readonly", getComputedStyle: "readonly",
        serviceWorker: "readonly", self: "readonly", globalThis: "readonly", module: "readonly",
        process: "readonly", require: "readonly", Buffer: "readonly",
        crypto: "readonly", atob: "readonly", btoa: "readonly", structuredClone: "readonly",
        AbortController: "readonly", TextEncoder: "readonly", TextDecoder: "readonly"
      }
    },
    rules: {
      "no-debugger": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-dupe-else-if": "error",
      "no-unreachable": "error",
      "no-cond-assign": "error",
      "no-fallthrough": "error",
      "no-unsafe-negation": "error",
      "no-constant-condition": "off",
      "no-console": "off"
    }
  }
];
