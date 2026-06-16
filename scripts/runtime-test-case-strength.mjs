// Runtime test: compile lib/case-strength TS to JS, then exercise each function.
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const tmpOut = path.resolve("./scripts/_tmp-cs");
fs.rmSync(tmpOut, { recursive: true, force: true });

execSync(
  `npx tsc --skipLibCheck --target es2020 --module nodenext --moduleResolution nodenext --outDir "${tmpOut}" ` +
    `lib/case-strength/types.ts lib/case-strength/validators.ts lib/case-strength/risk-detector.ts ` +
    `lib/case-strength/evidence-classifier.ts lib/case-strength/index.ts`,
  { stdio: "inherit" }
);

// tsc with individual file args flattens output to outDir root
const indexJs = path.resolve(tmpOut, "index.js");
const mod = await import(pathToFileURL(indexJs).href);
const {
  validateReceiptNumber,
  checkFileQuality,
  detectRiskFlags,
  classifyEvidence,
  missingTier1Documents,
} = mod;

let pass = 0;
let fail = 0;
const expect = (label, cond) => {
  if (cond) {
    pass++;
    console.log("  PASS", label);
  } else {
    fail++;
    console.log("  FAIL", label);
  }
};

console.log("\nReceipt number validator");
const r1 = validateReceiptNumber("MSC2390123456");
expect(
  "Valid MSC receipt accepted with service center name",
  r1.valid === true && r1.service_center === "National Benefits Center (Missouri)"
);

const r2 = validateReceiptNumber("eac2090123456");
expect(
  "Lowercase EAC normalized & accepted",
  r2.valid === true && r2.service_center_code === "EAC"
);

const r3 = validateReceiptNumber("MSC23901234");
expect("Too-short receipt rejected", r3.valid === false);

const r4 = validateReceiptNumber("");
expect("Empty receipt rejected", r4.valid === false);

const r5 = validateReceiptNumber("XYZ1234567890");
expect(
  "Unknown service center code: valid=true with warning message",
  r5.valid === true && !!r5.message
);

console.log("\nFile quality check");
const f1 = checkFileQuality({ name: "i130.pdf", size_bytes: 5 * 1024 * 1024 });
expect("5MB PDF passes", f1.passes === true);

const f2 = checkFileQuality({ name: "huge.pdf", size_bytes: 15 * 1024 * 1024 });
expect("15MB PDF fails (>12MB limit)", f2.passes === false && f2.issues.length > 0);

const f3 = checkFileQuality({ name: "evidence.docx", size_bytes: 1024 });
expect("DOCX rejected (wrong format)", f3.passes === false);

const f4 = checkFileQuality({ name: "scan.JPG", size_bytes: 2 * 1024 * 1024 });
expect("Uppercase .JPG accepted", f4.passes === true);

console.log("\nRisk detector");
const today = new Date("2026-05-16");
const flags1 = detectRiskFlags({ marriage_date: "2026-01-01" }, today);
expect(
  "Short marriage (Jan 2026, today May 2026) flagged",
  flags1.some((f) => f.id === "short_marriage_duration")
);

const flags2 = detectRiskFlags({ marriage_date: "2020-01-01" }, today);
expect(
  "Long marriage NOT flagged for short duration",
  !flags2.some((f) => f.id === "short_marriage_duration")
);

const flags3 = detectRiskFlags({ prior_i130_for_different_spouse: true });
expect(
  "Prior I-130 for different spouse flagged as critical",
  flags3.some((f) => f.id === "prior_i130_for_different_spouse" && f.severity === "critical")
);

const flags4 = detectRiskFlags({
  petitioner_had_prior_marriage: true,
  prior_marriage_termination_documents_present: false,
});
expect(
  "Missing prior termination flagged",
  flags4.some((f) => f.id === "missing_prior_marriage_termination")
);

const flags5 = detectRiskFlags({});
expect("Empty input returns no flags", flags5.length === 0);

const flags6 = detectRiskFlags({ never_met_in_person: true });
expect(
  "Never met in person flagged",
  flags6.some((f) => f.id === "never_met_in_person")
);

console.log("\nEvidence classifier");
const data = JSON.parse(fs.readFileSync("./data/visa-category/ir-1.json", "utf8"));
const tierMap = data.chapters[0].steps.find((s) => s.step_key === "step_1_2").evidence_tier_map;

const c1 = classifyEvidence(["TAX_RETURNS", "BANK_STATEMENTS", "AFFIDAVIT_BONA_FIDE"], tierMap);
expect(
  "Counts tiers correctly (2 T1, 1 T2, 0 T3)",
  c1.tier_1_count === 2 && c1.tier_2_count === 1 && c1.tier_3_count === 0
);

const c2 = classifyEvidence(["TAX_RETURNS", "BANK_STATEMENTS"], tierMap);
expect(
  "meets_recommended_tier_1_floor === true with 2 Tier 1 items",
  c2.meets_recommended_tier_1_floor === true
);

const c3 = classifyEvidence(["AFFIDAVIT_BONA_FIDE"], tierMap);
expect(
  "meets_recommended_tier_1_floor === false with 0 Tier 1 items",
  c3.meets_recommended_tier_1_floor === false
);

const c4 = classifyEvidence(["some_unknown_doc"], tierMap);
expect("Unknown doc keys go into unclassified", c4.unclassified.includes("some_unknown_doc"));

const tier1Total = tierMap.tiers.tier_1_strong.document_keys.length;
const missing = missingTier1Documents(["TAX_RETURNS"], tierMap);
expect(
  "missingTier1Documents excludes uploaded item, returns remaining",
  !missing.includes("TAX_RETURNS") && missing.length === tier1Total - 1
);

console.log("\n---");
console.log(`Results: ${pass} pass, ${fail} fail`);

// Cleanup
fs.rmSync(tmpOut, { recursive: true, force: true });

process.exit(fail === 0 ? 0 : 1);
