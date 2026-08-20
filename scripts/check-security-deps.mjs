/**
 * Fails CI if security-critical packages were downgraded or unpinned.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const require = createRequire(import.meta.url);

const MIN = {
  "pdfjs-dist": "6.2.108",
  dompurify: "3.2.0",
  "file-type": "19.0.0",
  jsdom: "26.0.0",
};

function parseSemver(raw) {
  const cleaned = String(raw).replace(/^[^\d]*/, "");
  const [major, minor, patch] = cleaned.split(".").map((n) => Number.parseInt(n, 10) || 0);
  return { major, minor, patch };
}

function gte(installed, minimum) {
  const a = parseSemver(installed);
  const b = parseSemver(minimum);
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch >= b.patch;
}

const failures = [];

function checkDeclared(name, expectedExact) {
  const declared = pkg.dependencies?.[name] || pkg.devDependencies?.[name];
  if (!declared) {
    failures.push(`${name} is missing from package.json`);
    return;
  }
  if (expectedExact && declared !== expectedExact && declared !== `^${expectedExact}`) {
    // pdfjs-dist must be an exact pin (no caret)
    if (name === "pdfjs-dist" && declared !== expectedExact) {
      failures.push(`pdfjs-dist must be pinned exactly to ${expectedExact}, found "${declared}"`);
    }
  }
}

function checkInstalled(name, minimum) {
  let version;
  try {
    version = require(`${name}/package.json`).version;
  } catch {
    failures.push(`${name} is not installed in node_modules`);
    return;
  }
  if (!gte(version, minimum)) {
    failures.push(`${name}@${version} is below required minimum ${minimum}`);
  }
}

checkDeclared("pdfjs-dist", MIN["pdfjs-dist"]);
checkDeclared("dompurify");
checkDeclared("file-type");

if (pkg.overrides?.["pdfjs-dist"] !== MIN["pdfjs-dist"]) {
  failures.push(
    `package.json overrides.pdfjs-dist must be "${MIN["pdfjs-dist"]}" so nested copies cannot downgrade`
  );
}

checkInstalled("pdfjs-dist", MIN["pdfjs-dist"]);
checkInstalled("dompurify", MIN.dompurify);
checkInstalled("file-type", MIN["file-type"]);
checkInstalled("jsdom", MIN.jsdom);

if (failures.length) {
  console.error("Security dependency check failed:\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Security dependency pins OK");
console.log(`  pdfjs-dist  ${require("pdfjs-dist/package.json").version}`);
console.log(`  dompurify   ${require("dompurify/package.json").version}`);
console.log(`  file-type   ${require("file-type/package.json").version}`);
