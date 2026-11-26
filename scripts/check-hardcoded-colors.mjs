#!/usr/bin/env node
/**
 * Dark mode ratchet (docs/dark-mode-implementation-plan.md, Phase 2.9).
 *
 * Counts hardcoded colours in .ts/.tsx under app/ and components/, per folder:
 *   - neutral Tailwind classes: bg-white, text-black, (bg|text|border|divide)-(gray|slate)-N
 *   - hex colour literals (#rrggbb, #rrggbbaa)
 * and compares each folder with scripts/color-baseline.json. A folder may go down,
 * never up; a folder missing from the baseline must have 0 (so new code uses tokens).
 *
 *   npm run check:colors            check, exit 1 on any increase
 *   npm run check:colors -- --update   rewrite the baseline (after converting a screen)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = ["app", "components"];
const BASELINE = join(ROOT, "scripts", "color-baseline.json");
const SKIP = new Set(["node_modules", ".next", "__tests__"]);

const NEUTRAL =
  /\b(?:bg-white|text-black|(?:bg|text|border|divide|ring|from|to|via)-(?:gray|slate)-\d{2,3})\b/g;
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6})\b/g;

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function count() {
  const counts = {};
  for (const top of SCAN_DIRS) {
    const base = join(ROOT, top);
    if (!existsSync(base)) continue;
    for (const file of walk(base, [])) {
      const text = readFileSync(file, "utf8");
      const n = (text.match(NEUTRAL)?.length ?? 0) + (text.match(HEX)?.length ?? 0);
      if (!n) continue;
      const folder = relative(ROOT, dirname(file)).split(sep).join("/");
      counts[folder] = (counts[folder] ?? 0) + n;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

const current = count();
const total = Object.values(current).reduce((a, b) => a + b, 0);

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE, JSON.stringify(current, null, 2) + "\n");
  console.log(`Baseline written: ${Object.keys(current).length} folders, ${total} hardcoded colours.`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error("No baseline. Run: npm run check:colors -- --update");
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
const increased = Object.entries(current)
  .filter(([folder, n]) => n > (baseline[folder] ?? 0))
  .map(([folder, n]) => `  ${folder}: ${baseline[folder] ?? 0} -> ${n}`);
const baselineTotal = Object.values(baseline).reduce((a, b) => a + b, 0);

if (increased.length) {
  console.error("Hardcoded colours went UP. Use colour tokens instead (docs/dark-mode-implementation-plan.md):");
  console.error(increased.join("\n"));
  process.exit(1);
}

console.log(`OK: ${total} hardcoded colours (baseline ${baselineTotal}).`);
if (total < baselineTotal) console.log("Count went down. Run `npm run check:colors -- --update` to lock it in.");
