// scripts/ocr-coverage-check.mjs
// Static end-to-end coverage check for OCR auto-fill:
//   extracted field (registry)  →  saves to profile? (merge ALLOWED_PATHS)
//                                →  has a mapper entry? (FIELD_MAPPINGS)
//                                →  do those form keys EXIST in a real form? (ds260/i130/i130a/i864)
// Run: node scripts/ocr-coverage-check.mjs
import { readFileSync } from "node:fs";

const R = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// ── 1) Extracted fields per docType (registry.ts *_FIELDS) ──────────────────
const registry = R("lib/document-ocr/registry.ts");
function fieldsOfConst(name) {
  const start = registry.indexOf(`const ${name}`);
  const block = registry.slice(start, registry.indexOf("];", start));
  return [...block.matchAll(/key:\s*"([^"]+)"/g)].map((m) => m[1]);
}
const DOC_FIELDS = {
  passport: fieldsOfConst("PASSPORT_FIELDS"),
  marriage: fieldsOfConst("MARRIAGE_FIELDS"),
  cnic: fieldsOfConst("CNIC_FIELDS"),
  birth: fieldsOfConst("BIRTH_FIELDS"),
  divorce: fieldsOfConst("DIVORCE_FIELDS"),
};

// ── 2) merge route: ALLOWED_PATHS + PERSON_KEYS ─────────────────────────────
const merge = R("app/api/profile/merge/route.ts");
const setBlock = (decl) => {
  const s = merge.indexOf(decl);
  return [...merge.slice(s, merge.indexOf("]", s)).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
};
const ALLOWED_PATHS = new Set(setBlock("const ALLOWED_PATHS = new Set(["));
const PERSON_KEYS = new Set(setBlock("const PERSON_KEYS = ["));

// ── 3) mapper FIELD_MAPPINGS: profilePath -> [formKeys] ─────────────────────
const mapper = R("lib/autoFill/mapper.ts");
const fmStart = mapper.indexOf("export const FIELD_MAPPINGS");
const fmEnd = mapper.indexOf("\n};", fmStart);
const fmBlock = mapper.slice(fmStart, fmEnd);
const FIELD_MAPPINGS = {};
for (const m of fmBlock.matchAll(/(?:"([\w.]+)"|([\w.]+)):\s*\[([\s\S]*?)\]/g)) {
  const key = m[1] || m[2];
  const vals = [...m[3].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  if (key) FIELD_MAPPINGS[key] = vals;
}

// ── 4) Real form field keys per form ────────────────────────────────────────
const FORM_FILES = { "DS-260": "ds260", "I-130": "i130", "I-130A": "i130a", "I-864": "i864" };
const FORM_KEYS = {};
for (const [label, file] of Object.entries(FORM_FILES)) {
  const src = R(`lib/formConfig/${file}.ts`);
  FORM_KEYS[label] = new Set([...src.matchAll(/\bkey:\s*"([^"]+)"/g)].map((m) => m[1]));
}
const formsForKey = (formKey) =>
  Object.entries(FORM_KEYS).filter(([, set]) => set.has(formKey)).map(([l]) => l);

// ── 5) Build the matrix ─────────────────────────────────────────────────────
let gaps = 0;
for (const [doc, fields] of Object.entries(DOC_FIELDS)) {
  console.log(`\n══════ ${doc.toUpperCase()} ══════`);
  for (const key of fields) {
    const saved = ALLOWED_PATHS.has(key) || PERSON_KEYS.has(key);
    const formKeys = FIELD_MAPPINGS[key] || [];
    const hitForms = [...new Set(formKeys.flatMap(formsForKey))];
    const mapped = formKeys.length > 0;
    const fillsForm = hitForms.length > 0;

    let status, note;
    if (saved && fillsForm) {
      status = "✅";
      note = `forms: ${hitForms.join(", ")}`;
    } else if (saved && !mapped) {
      status = "🟡";
      note = "saved (display/verify only — no form mapping)";
    } else if (saved && mapped && !fillsForm) {
      status = "⚠️ ";
      note = `mapped to [${formKeys.join(", ")}] but NO form has that key`;
      gaps++;
    } else if (!saved) {
      status = "❌";
      note = "NOT in merge ALLOWED_PATHS → will not save";
      gaps++;
    }
    console.log(`  ${status} ${key.padEnd(42)} ${note}`);
  }
}
console.log(`\n${gaps === 0 ? "✅ No blocking gaps." : `⚠️  ${gaps} field(s) need attention (see ❌ / ⚠️ above).`}`);
