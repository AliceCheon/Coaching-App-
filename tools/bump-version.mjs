// Bump di versione in un colpo solo (AGENTS.md: "aggiornali tutti con un sed globale").
// Uso:  node tools/bump-version.mjs v147.60-suffisso
// Aggiorna app-config, index.html, manifest, service worker, FIREBASE-LOGIN.md e
// tutti i test (che fino ad ora hardcodavano la versione).
import fs from "node:fs";
import path from "node:path";

const newBuild = process.argv[2];
if (!newBuild || !/^v\d+\.\d+-.+$/.test(newBuild)) {
  console.error("Uso: node tools/bump-version.mjs v147.60-suffisso");
  process.exit(1);
}

const parse = (build) => {
  const m = build.match(/^v(\d+)\.(\d+)-(.+)$/);
  return { major: m[1], minor: m[2], suffix: m[3], token: `v${m[1]}${m[2]}`, dot: `v${m[1]}.${m[2]}`, build };
};

const root = process.cwd();
const config = fs.readFileSync(path.join(root, "app-config-v144.js"), "utf8");
const oldBuild = config.match(/build:\s*"([^"]+)"/)?.[1];
if (!oldBuild) {
  console.error("Campo build non trovato in app-config-v144.js");
  process.exit(1);
}
const from = parse(oldBuild);
const to = parse(newBuild);

const targets = ["index.html", "manifest.webmanifest", "service-worker.js", "app-config-v144.js", "FIREBASE-LOGIN.md"];
for (const file of fs.readdirSync(path.join(root, "tests"))) {
  if (file.endsWith(".mjs")) targets.push(path.join("tests", file));
}

let changed = 0;
for (const rel of targets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, "utf8");
  const text = before
    .split(from.build).join(to.build)
    .split(`atlas-app-${from.token}-${from.suffix}`).join(`atlas-app-${to.token}-${to.suffix}`)
    .split(from.token).join(to.token)
    .split(from.dot).join(to.dot);
  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    changed += 1;
  }
}

console.log(`Versione ${from.build} -> ${to.build} (token ${from.token} -> ${to.token}); ${changed} file aggiornati.`);
