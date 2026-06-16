// lib/document-ocr/passportParser.ts
// Turns raw OCR text from a passport into clean, canonical fields.
//
// Two strategies, tried in order:
//   1. MRZ  — the two machine-readable lines at the bottom of a passport
//             (TD3 format, 44 chars each). Very accurate when readable.
//   2. Labels — fallback that looks near words like "Date of birth",
//               "Passport No", etc. Less accurate, used when MRZ is missing.
//
// Output keys are MasterProfile dot-paths (see lib/autoFill/mapper.ts FIELD_MAPPINGS)
// so the values flow straight into the rest of the app.

export interface PassportFields {
  "name.first"?: string;
  "name.last"?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  sex?: string; // "Male" | "Female"
  nationality?: string;
  passportNumber?: string;
  passportIssueDate?: string; // YYYY-MM-DD — from the visible photo page (not the MRZ)
  passportPlaceOfIssue?: string; // City / issuing authority — DS-260
  passportBookNumber?: string; // Booklet / tracking number — DS-260
  passportExpiry?: string; // YYYY-MM-DD
  passportCountry?: string;
}

export interface PassportParseResult {
  fields: PassportFields;
  /** 0..1 confidence per field key that was found */
  confidence: Partial<Record<keyof PassportFields, number>>;
  warnings: string[];
  source: "mrz" | "labels" | "mixed" | "none";
}

// ─── Country code → name (common ones; unknown codes are kept as-is) ────────────
const COUNTRY_CODES: Record<string, string> = {
  PAK: "Pakistan",
  USA: "United States",
  IND: "India",
  GBR: "United Kingdom",
  CAN: "Canada",
  AUS: "Australia",
  BGD: "Bangladesh",
  LKA: "Sri Lanka",
  NPL: "Nepal",
  AFG: "Afghanistan",
  CHN: "China",
  SAU: "Saudi Arabia",
  ARE: "United Arab Emirates",
  DEU: "Germany",
  FRA: "France",
  ITA: "Italy",
  ESP: "Spain",
  TUR: "Turkey",
  IRN: "Iran",
};

function countryFromCode(code: string): string {
  const clean = code.replace(/[^A-Z]/g, "").toUpperCase();
  return COUNTRY_CODES[clean] ?? clean;
}

// ─── Date helpers ───────────────────────────────────────────────────────────────

function toIso(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Convert an MRZ 6-digit date (YYMMDD) to ISO.
 * For dates of birth we assume the past; for expiry we assume the future.
 */
function mrzDateToIso(yymmdd: string, kind: "birth" | "expiry"): string | null {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));

  let year: number;
  if (kind === "expiry") {
    year = 2000 + yy; // passports expire in the future
  } else {
    const currentYy = new Date().getUTCFullYear() % 100;
    year = yy > currentYy ? 1900 + yy : 2000 + yy;
  }
  return toIso(year, mm, dd);
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

/** Find the first parseable date inside a chunk of text → ISO. */
function extractDateFromText(text: string): string | null {
  const slashOrDash = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
  if (slashOrDash) {
    let year = Number(slashOrDash[3]);
    if (year < 100) year = year >= 40 ? 1900 + year : 2000 + year;
    return toIso(year, Number(slashOrDash[2]), Number(slashOrDash[1]));
  }

  const monthName = text.match(
    /\b(\d{1,2})\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(\d{2,4})\b/i
  );
  if (monthName) {
    let year = Number(monthName[3]);
    if (year < 100) year = year >= 40 ? 1900 + year : 2000 + year;
    return toIso(year, MONTHS[monthName[2].toLowerCase()], Number(monthName[1]));
  }

  const iso = text.match(/\b(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/);
  if (iso) {
    return toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }
  return null;
}

// ─── Text utilities ─────────────────────────────────────────────────────────────

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** Tidy an MRZ name segment: "AHMED<<ALI<KHAN" → "Ahmed" / "Ali Khan". */
function cleanMrzName(segment: string): string {
  return segment
    .replace(/</g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── MRZ parsing (TD3 passport) ─────────────────────────────────────────────────
//
// Line 1: P<ISO SURNAME<<GIVEN<NAMES<<<...        (44 chars)
// Line 2: NNNNNNNNNcCCCYYMMDDcSYYMMDDc...          (44 chars)
//   0-8 passport no, 10-12 nationality, 13-18 DOB, 20 sex, 21-26 expiry

/** OCR frequently misreads the MRZ filler "<" as other characters. */
function normalizeFiller(line: string): string {
  return line
    .replace(/[«‹‘’`]/g, "<")
    // a run of 2+ identical filler-prone letters is almost always "<<" filler
    .replace(/K{2,}/g, (m) => "<".repeat(m.length))
    .replace(/C{3,}/g, (m) => "<".repeat(m.length));
}

function findMrzLines(rawLines: string[]): { l1: string; l2: string } | null {
  // Normalise: drop spaces, upper-case, map common "<" misreads.
  const norm = rawLines
    .map((l) => l.replace(/\s+/g, "").toUpperCase())
    .map(normalizeFiller);

  // A line is MRZ-like if it is long enough and almost entirely [A-Z0-9<].
  const isMrzLike = (l: string) => {
    if (l.length < 25) return false;
    const good = (l.match(/[A-Z0-9<]/g) || []).length;
    return good / l.length >= 0.85;
  };
  const candidates = norm.filter(isMrzLike);

  // Line 1 starts with "P" + filler/letter; must contain "<" fillers (names padding).
  for (let i = 0; i < candidates.length; i += 1) {
    if (/^P[<KC«]/.test(candidates[i]) && candidates[i].includes("<")) {
      // line 2 is the next MRZ-like line that looks like a data line
      for (let j = i + 1; j < candidates.length; j += 1) {
        if (/^[A-Z0-9<]{9}.?[A-Z<]{3}\d{6}/.test(candidates[j])) {
          return { l1: candidates[i], l2: candidates[j] };
        }
      }
      // fall back to the immediate next candidate
      if (candidates[i + 1]) return { l1: candidates[i], l2: candidates[i + 1] };
    }
  }

  // Some scans only return the data line (line 2). Detect it on its own.
  for (const c of candidates) {
    if (/^[A-Z0-9<]{9}\d?[A-Z<]{3}\d{6}/.test(c)) {
      return { l1: "", l2: c };
    }
  }
  return null;
}

function parseMrz(rawLines: string[]): {
  fields: PassportFields;
  confidence: PassportParseResult["confidence"];
} | null {
  const mrz = findMrzLines(rawLines);
  if (!mrz) return null;

  const fields: PassportFields = {};
  const confidence: PassportParseResult["confidence"] = {};

  // ── Line 1: names + issuing country ──
  if (mrz.l1) {
    const body = mrz.l1.slice(5); // after "P<ISO"
    const issuing = mrz.l1.slice(2, 5);
    if (/^[A-Z<]{3}$/.test(issuing)) {
      fields.passportCountry = countryFromCode(issuing);
      confidence.passportCountry = 0.9;
    }
    const parts = body.split("<<");
    const surname = cleanMrzName(parts[0] ?? "");
    const given = cleanMrzName(parts[1] ?? "");
    if (surname) {
      fields["name.last"] = surname;
      confidence["name.last"] = 0.85;
    }
    if (given) {
      fields["name.first"] = given;
      confidence["name.first"] = 0.85;
    }
  }

  // ── Line 2: passport no, nationality, DOB, sex, expiry ──
  const l2 = mrz.l2;
  // OCR can read filler "<" in the passport-number block as "K"; strip trailing fillers.
  const passportNo = l2.slice(0, 9).replace(/[<K]+$/, "").replace(/</g, "");
  if (passportNo && /[A-Z0-9]{5,}/.test(passportNo)) {
    fields.passportNumber = passportNo;
    confidence.passportNumber = 0.9;
  }

  const nationality = l2.slice(10, 13);
  if (/^[A-Z<]{3}$/.test(nationality)) {
    fields.nationality = countryFromCode(nationality);
    confidence.nationality = 0.9;
  }

  const dob = mrzDateToIso(l2.slice(13, 19), "birth");
  if (dob) {
    fields.dateOfBirth = dob;
    confidence.dateOfBirth = 0.9;
  }

  const sexChar = l2.slice(20, 21);
  if (sexChar === "M") {
    fields.sex = "Male";
    confidence.sex = 0.9;
  } else if (sexChar === "F") {
    fields.sex = "Female";
    confidence.sex = 0.9;
  }

  const expiry = mrzDateToIso(l2.slice(21, 27), "expiry");
  if (expiry) {
    fields.passportExpiry = expiry;
    confidence.passportExpiry = 0.9;
  }

  return Object.keys(fields).length > 0 ? { fields, confidence } : null;
}

// ─── Loose MRZ fragment parsing ─────────────────────────────────────────────────
//
// When OCR mangles the two-line layout (common on phone photos), the strict
// position-based parser fails. But the MRZ still contains a very distinctive
// run we can find anywhere: COUNTRY(3) + DOB(6) + check + SEX + EXPIRY(6),
// e.g. "PAK0308072M300926". We also recover names from any "<<"-padded segment.

function parseMrzFragments(rawLines: string[]): {
  fields: PassportFields;
  confidence: PassportParseResult["confidence"];
} | null {
  const norm = rawLines
    .map((l) => l.replace(/\s+/g, "").toUpperCase())
    .map(normalizeFiller);

  const mrzish = norm.filter((l) => {
    if (l.length < 12) return false;
    const good = (l.match(/[A-Z0-9<]/g) || []).length;
    return good / l.length >= 0.8;
  });
  if (mrzish.length === 0) return null;

  const blob = mrzish.join("\n");
  const fields: PassportFields = {};
  const confidence: PassportParseResult["confidence"] = {};

  // Distinctive data run: 3-letter country, DOB(6), check digit, sex, expiry(6).
  const data = blob.match(/([A-Z<]{3})(\d{6})\d([MFX<])(\d{6})/);
  if (data) {
    const [, country, dobRaw, sexRaw, expRaw] = data;
    if (/^[A-Z]{3}$/.test(country)) {
      fields.nationality = countryFromCode(country);
      confidence.nationality = 0.8;
      // Issuing country normally equals the nationality code; the dedicated
      // "P<ISO" line is often mangled by OCR, so derive it here as a default.
      fields.passportCountry = countryFromCode(country);
      confidence.passportCountry = 0.6;
    }
    const dob = mrzDateToIso(dobRaw, "birth");
    if (dob) {
      fields.dateOfBirth = dob;
      confidence.dateOfBirth = 0.8;
    }
    if (sexRaw === "M") {
      fields.sex = "Male";
      confidence.sex = 0.8;
    } else if (sexRaw === "F") {
      fields.sex = "Female";
      confidence.sex = 0.8;
    }
    const exp = mrzDateToIso(expRaw, "expiry");
    if (exp) {
      fields.passportExpiry = exp;
      confidence.passportExpiry = 0.8;
    }
  }

  // Names: the "<<"-padded segment. Format is SURNAME<<GIVEN<NAMES, but OCR may
  // prepend junk (e.g. the passport number). Left side counts as surname only if
  // it's purely alphabetic; the right side is the given names.
  const nameLine = mrzish.find((l) => l.includes("<<"));
  if (nameLine) {
    const [leftRaw = "", rightRaw = ""] = nameLine.split("<<");
    const leftLetters = leftRaw.replace(/</g, "");
    if (/^[A-Z]{2,}$/.test(leftLetters)) {
      fields["name.last"] = cleanMrzName(leftRaw);
      confidence["name.last"] = 0.7;
    }
    const given = cleanMrzName(rightRaw);
    if (given && /[A-Za-z]/.test(given)) {
      fields["name.first"] = given;
      confidence["name.first"] = 0.7;
    }
  }

  return Object.keys(fields).length > 0 ? { fields, confidence } : null;
}

// ─── Label-based fallback ─────────────────────────────────────────────────────────

function valueNearLabel(lines: string[], labelPattern: RegExp): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!labelPattern.test(lines[i])) continue;
    // value is often on the same line after the label, or on the next line.
    // Strip the label plus any trailing label-word leftovers (e.g. the "s" in
    // "Given Names" once "Given Name" is removed) before deciding it's real.
    const sameLine = lines[i].replace(labelPattern, "").replace(/[:.]/g, "").trim();
    // A 1-char remainder is almost always label junk → look on the next line.
    if (sameLine.length >= 2) return sameLine;
    if (lines[i + 1]) return lines[i + 1].trim();
  }
  return null;
}

function dateNearLabel(lines: string[], labelPattern: RegExp): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!labelPattern.test(lines[i])) continue;
    const window = [lines[i], lines[i + 1], lines[i + 2]].filter(Boolean).join(" ");
    const date = extractDateFromText(window);
    if (date) return date;
  }
  return null;
}

function parseLabels(rawText: string, rawLines: string[]): {
  fields: PassportFields;
  confidence: PassportParseResult["confidence"];
} {
  const fields: PassportFields = {};
  const confidence: PassportParseResult["confidence"] = {};

  // Passport numbers are usually letters+digits (e.g. "AB1234567"). Prefer a token
  // near a "Passport No" label, else scan the whole doc for that distinctive shape.
  const passportNoLabel = valueNearLabel(
    rawLines,
    /passport\s*(?:no|number|#)|document\s*no|passport\s*&|passport.*number/i
  );
  // 1-2 letters + 6-8 digits (e.g. "M7228930"). Don't require a trailing word
  // boundary — OCR often glues a stray letter onto the end ("M7228930I") — but do
  // reject a following digit so we never grab part of a longer number.
  const passportTokenRe = /\b([A-Z]{1,2}\d{6,8})(?![0-9])/;
  let passportNo: string | null = null;
  if (passportNoLabel) {
    const m = passportNoLabel.match(passportTokenRe) || passportNoLabel.match(/[A-Z0-9]{6,9}/i);
    if (m) passportNo = m[0].toUpperCase();
  }
  if (!passportNo) {
    const m = rawText.toUpperCase().match(passportTokenRe);
    if (m) passportNo = m[0];
  }
  if (passportNo) {
    fields.passportNumber = passportNo;
    confidence.passportNumber = passportNoLabel ? 0.55 : 0.4;
  }

  // "Sur(n)ame" — OCR often drops the n; also handle "Family Name".
  const surname = valueNearLabel(rawLines, /sur\s*n?ame|family\s*name/i);
  if (surname && /^[A-Za-z ,'-]{2,}$/.test(surname)) {
    fields["name.last"] = cleanMrzName(surname);
    confidence["name.last"] = 0.5;
  }

  const given = valueNearLabel(rawLines, /given\s*name|first\s*name/i);
  if (given && /^[A-Za-z ,'-]{2,}$/.test(given)) {
    fields["name.first"] = cleanMrzName(given);
    confidence["name.first"] = 0.5;
  }

  const dob = dateNearLabel(rawLines, /date\s*of\s*birth|d\.?o\.?b/i);
  if (dob) {
    fields.dateOfBirth = dob;
    confidence.dateOfBirth = 0.55;
  }

  const expiry = dateNearLabel(rawLines, /date\s*of\s*expiry|expir|valid\s*until/i);
  if (expiry) {
    fields.passportExpiry = expiry;
    confidence.passportExpiry = 0.55;
  }

  // Issue date — "Date of Issue" / "Issued on". Distinct label from expiry.
  const issue = dateNearLabel(rawLines, /date\s*of\s*issue|issued?\s*(?:on|date)/i);
  if (issue) {
    fields.passportIssueDate = issue;
    confidence.passportIssueDate = 0.5;
  }

  // Place of issue / issuing authority (e.g. "Islamabad"). Best-effort.
  const placeOfIssue = valueNearLabel(
    rawLines,
    /place\s*of\s*issue|issuing\s*authority|authority/i
  );
  if (placeOfIssue && /^[A-Za-z ,'-]{2,40}$/.test(placeOfIssue)) {
    fields.passportPlaceOfIssue = cleanMrzName(placeOfIssue);
    confidence.passportPlaceOfIssue = 0.4;
  }

  // Booklet / tracking number — labelled separately from the passport number.
  const bookNo = valueNearLabel(rawLines, /book(?:let)?\s*(?:no|number)|tracking\s*(?:no|number)/i);
  if (bookNo) {
    const m = bookNo.match(/[A-Z0-9]{6,}/i);
    if (m) {
      fields.passportBookNumber = m[0].toUpperCase();
      confidence.passportBookNumber = 0.4;
    }
  }

  const nationality = valueNearLabel(rawLines, /nationality|citizenship/i);
  if (nationality && /^[A-Za-z ]{3,}$/.test(nationality)) {
    fields.nationality = cleanMrzName(nationality);
    confidence.nationality = 0.5;
  }

  if (/\bsex\b/i.test(rawText)) {
    const sexMatch = rawText.match(/sex[:\s]*([MF])\b/i);
    if (sexMatch) {
      fields.sex = sexMatch[1].toUpperCase() === "M" ? "Male" : "Female";
      confidence.sex = 0.55;
    }
  }

  return { fields, confidence };
}

// ─── Public entry point ───────────────────────────────────────────────────────────

const FIELD_LABELS: Record<keyof PassportFields, string> = {
  "name.first": "Given name",
  "name.last": "Surname",
  dateOfBirth: "Date of birth",
  sex: "Sex",
  nationality: "Nationality",
  passportNumber: "Passport number",
  passportIssueDate: "Passport issue date",
  passportPlaceOfIssue: "Place of issue",
  passportBookNumber: "Passport book number",
  passportExpiry: "Passport expiry",
  passportCountry: "Issuing country",
};

// Optional fields we never warn about when missing (bonus reads, not always printed).
const OPTIONAL_FIELDS: ReadonlySet<keyof PassportFields> = new Set([
  "passportCountry",
  "passportIssueDate",
  "passportPlaceOfIssue",
  "passportBookNumber",
]);

export function parsePassportText(rawText: string): PassportParseResult {
  const cleaned = (rawText || "").replace(/ /g, "").trim();
  const lines = normalizeLines(cleaned);

  const mrz = parseMrz(lines);
  const fragments = parseMrzFragments(lines);
  const labels = parseLabels(cleaned, lines);

  // Merge priority (low → high): labels < loose MRZ fragments < strict MRZ.
  // Spreading later overwrites earlier, so the most reliable source wins per key.
  const fields: PassportFields = {
    ...labels.fields,
    ...(fragments?.fields ?? {}),
    ...(mrz?.fields ?? {}),
  };
  const confidence: PassportParseResult["confidence"] = {
    ...labels.confidence,
    ...(fragments?.confidence ?? {}),
    ...(mrz?.confidence ?? {}),
  };

  let source: PassportParseResult["source"] = "none";
  const hasMrz =
    (!!mrz && Object.keys(mrz.fields).length > 0) ||
    (!!fragments && Object.keys(fragments.fields).length > 0);
  const hasLabels = Object.keys(labels.fields).length > 0;
  if (hasMrz && hasLabels) source = "mixed";
  else if (hasMrz) source = "mrz";
  else if (hasLabels) source = "labels";

  const warnings: string[] = [];
  (Object.keys(FIELD_LABELS) as (keyof PassportFields)[]).forEach((key) => {
    if (OPTIONAL_FIELDS.has(key)) return; // optional, not warned
    if (!fields[key]) {
      warnings.push(`${FIELD_LABELS[key]} was not confidently detected — please fill it in.`);
    }
  });

  return { fields, confidence, warnings, source };
}
