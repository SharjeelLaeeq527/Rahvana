// lib/document-ocr/birthCertParser.ts
// Turns raw OCR text from a birth certificate into clean, canonical profile fields.
//
// Handles the IR-1 journey's beneficiary birth proof — typically a NADRA
// Computerized Birth Certificate or "Form-B" (Child Registration Certificate).
// These are bilingual: the English side carries labels like "Name", "Date of Birth",
// "Place of Birth". The free English OCR engine reads that side; when it reads
// nothing (Urdu-only / handwritten / low quality) the route falls back to the
// Gemini Vision extractor.
//
// Output keys are MasterProfile dot-paths. For a beneficiary birth certificate the
// merge route remaps these onto MasterProfile.beneficiary.* (which already carries
// name, dateOfBirth and placeOfBirth — see types/profile.ts).

export interface BirthCertFields {
  "name.first"?: string;
  "name.last"?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  "placeOfBirth.city"?: string;
  "placeOfBirth.country"?: string;
  // Parents — a NADRA birth certificate / Form-B lists both parents' names. These
  // feed DS-260 Section 2 ("Father's/Mother's Information") and the I-130A parent
  // section, so capturing them here saves the applicant re-typing them later.
  "father.name.first"?: string;
  "father.name.last"?: string;
  "mother.name.first"?: string;
  "mother.name.last"?: string;
}

export interface BirthCertParseResult {
  fields: BirthCertFields;
  confidence: Partial<Record<keyof BirthCertFields, number>>;
  warnings: string[];
  source: "labels" | "partial" | "none";
}

// ─── Date helpers (same conventions as the other parsers) ───────────────────────

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

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function extractDateFromText(text: string): string | null {
  const slashOrDash = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
  if (slashOrDash) {
    let year = Number(slashOrDash[3]);
    if (year < 100) year = year >= 40 ? 1900 + year : 2000 + year;
    return toIso(year, Number(slashOrDash[2]), Number(slashOrDash[1]));
  }
  const monthName = text.match(
    /\b(\d{1,2})\s*(?:st|nd|rd|th)?[\s\-\/.]*(?:of[\s\-\/.]*)?(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-\/.,]*(\d{2,4})\b/i
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

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// "Date of Birth" only — NOT registration / issue / print dates, which also appear
// on a NADRA birth certificate and must not be mistaken for the DOB.
const DOB_LABEL = /date\s*of\s*birth|^d\.?o\.?b\.?\b/i;
const PLACE_LABEL = /place\s*of\s*birth/i;
// The child's own name. Father/Mother names sit on their own labelled lines.
const NAME_LABEL = /(?<!father\s)(?<!mother\s)(?<!parent\s)\b(?:name|child(?:'s)?\s*name)\b/i;
const FATHER_LABEL = /father(?:'s)?\s*name/i;
const MOTHER_LABEL = /mother(?:'s)?\s*name/i;

function dateNearLabel(lines: string[], labelPattern: RegExp, forwardLines = 4): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!labelPattern.test(lines[i])) continue;
    const inline = extractDateFromText(lines[i]);
    if (inline) return inline;
    const end = Math.min(lines.length, i + 1 + forwardLines);
    for (let j = i + 1; j < end; j += 1) {
      const d = extractDateFromText(lines[j]);
      if (d) return d;
    }
  }
  return null;
}

function valueNearLabel(lines: string[], labelPattern: RegExp): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!labelPattern.test(lines[i])) continue;
    const sameLine = lines[i].replace(labelPattern, "").replace(/[:.\-]/g, " ").trim();
    if (sameLine.length >= 2) return sameLine;
    if (lines[i + 1] && !/father|mother|parent|date|place/i.test(lines[i + 1])) {
      return lines[i + 1].trim();
    }
  }
  return null;
}

function splitName(full: string): { first?: string; last?: string } {
  const clean = full.replace(/[^A-Za-z\s'.-]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return {};
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 1) return { first: parts[0] };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

export function parseBirthCertText(rawText: string): BirthCertParseResult {
  const lines = normalizeLines(rawText || "");
  const fields: BirthCertFields = {};
  const confidence: BirthCertParseResult["confidence"] = {};
  const warnings: string[] = [];
  let source: BirthCertParseResult["source"] = "none";

  // 1) Date of birth — the field the journey forms care about most.
  const dob = dateNearLabel(lines, DOB_LABEL);
  if (dob) {
    fields.dateOfBirth = dob;
    confidence.dateOfBirth = 0.7;
    source = "labels";
  }

  // 2) Child's name.
  const nameRaw = valueNearLabel(lines, NAME_LABEL);
  if (nameRaw && /[A-Za-z]{2,}/.test(nameRaw) && nameRaw.length <= 60) {
    const { first, last } = splitName(nameRaw);
    if (first) {
      fields["name.first"] = first;
      confidence["name.first"] = 0.5;
    }
    if (last) {
      fields["name.last"] = last;
      confidence["name.last"] = 0.5;
    }
    if (source === "none") source = "partial";
  }

  // 3) Place of birth (city). Best-effort.
  const place = valueNearLabel(lines, PLACE_LABEL);
  if (place && /[A-Za-z]{2,}/.test(place) && place.length <= 60) {
    fields["placeOfBirth.city"] = place.replace(/\s+/g, " ").trim();
    confidence["placeOfBirth.city"] = 0.45;
    if (source === "none") source = "partial";
  }

  // 4) Parents' names → DS-260 Section 2 + I-130A parent section.
  const fatherRaw = valueNearLabel(lines, FATHER_LABEL);
  if (fatherRaw && /[A-Za-z]{2,}/.test(fatherRaw) && fatherRaw.length <= 60) {
    const { first, last } = splitName(fatherRaw);
    if (first) {
      fields["father.name.first"] = first;
      confidence["father.name.first"] = 0.5;
    }
    if (last) {
      fields["father.name.last"] = last;
      confidence["father.name.last"] = 0.5;
    }
    if (source === "none") source = "partial";
  }

  const motherRaw = valueNearLabel(lines, MOTHER_LABEL);
  if (motherRaw && /[A-Za-z]{2,}/.test(motherRaw) && motherRaw.length <= 60) {
    const { first, last } = splitName(motherRaw);
    if (first) {
      fields["mother.name.first"] = first;
      confidence["mother.name.first"] = 0.5;
    }
    if (last) {
      fields["mother.name.last"] = last;
      confidence["mother.name.last"] = 0.5;
    }
    if (source === "none") source = "partial";
  }

  if (!fields.dateOfBirth && !fields["name.first"]) {
    warnings.push(
      "We couldn't confidently read this birth certificate — please fill in the fields. Tip: an English translation reads more reliably."
    );
  }

  return { fields, confidence, warnings, source };
}
