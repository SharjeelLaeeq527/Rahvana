// scripts/ocr-autofill-sim.mjs
// Concrete proof: build a profile from the values our live OCR tests extracted, then
// show exactly which fields autofill in each form (using the real FIELD_MAPPINGS +
// real form field keys). Run: node scripts/ocr-autofill-sim.mjs
import { readFileSync } from "node:fs";
const R = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// FIELD_MAPPINGS (profilePath -> [formKeys]) parsed from mapper.ts
const mapper = R("lib/autoFill/mapper.ts");
const fmBlock = mapper.slice(
  mapper.indexOf("export const FIELD_MAPPINGS"),
  mapper.indexOf("\n};", mapper.indexOf("export const FIELD_MAPPINGS"))
);
const FIELD_MAPPINGS = {};
for (const m of fmBlock.matchAll(/(?:"([\w.]+)"|([\w.]+)):\s*\[([\s\S]*?)\]/g)) {
  const key = m[1] || m[2];
  FIELD_MAPPINGS[key] = [...m[3].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}
// formKey -> profilePath (reverse)
const FORMKEY_TO_PATH = {};
for (const [path, keys] of Object.entries(FIELD_MAPPINGS)) for (const k of keys) FORMKEY_TO_PATH[k] = path;

// Real form field keys per form
const FORMS = { "DS-260": "ds260", "I-130": "i130", "I-130A": "i130a", "I-864": "i864" };
const FORM_KEYS = {};
for (const [label, file] of Object.entries(FORMS))
  FORM_KEYS[label] = [...R(`lib/formConfig/${file}.ts`).matchAll(/\bkey:\s*"([^"]+)"/g)].map((m) => m[1]);

// Profile built from the values our live vision tests actually returned
const profile = {
  name: { first: "Muhammad Ahmed", last: "Khan" },
  nativeFullName: "محمد احمد خان",
  dateOfBirth: "2023-05-12",
  sex: "Male",
  nationality: "Pakistan",
  passportNumber: "SS1165121",
  passportIssueDate: "2025-09-27",
  passportExpiry: "2030-09-26",
  passportCountry: "Pakistan",
  cnic: "12345-6789012-3",
  placeOfBirth: { city: "Karachi", state: "Sindh", country: "Pakistan" },
  father: { name: { first: "Abdul Rahman", last: "Khan" }, dateOfBirth: "1975-01-01" },
  mother: { name: { first: "Fatima", last: "Bibi" }, dateOfBirth: "1980-01-01" },
  relationship: {
    marriageDate: "2025-06-18",
    marriagePlace: { city: "Lahore", state: "Punjab", country: "Pakistan" },
    priorMarriage: { dateMarriageEnded: "2020-02-15" },
  },
};
const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

for (const [label, keys] of Object.entries(FORM_KEYS)) {
  const filled = [];
  for (const fk of [...new Set(keys)]) {
    const path = FORMKEY_TO_PATH[fk];
    if (!path) continue;
    const val = get(profile, path);
    if (val !== undefined && val !== "") filled.push([fk, path, val]);
  }
  console.log(`\n══════ ${label} — ${filled.length} fields auto-filled ══════`);
  for (const [fk, path, val] of filled) console.log(`  ${fk.padEnd(26)} ← ${String(path).padEnd(34)} = ${val}`);
}
