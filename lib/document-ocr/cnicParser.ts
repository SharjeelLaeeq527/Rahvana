// lib/document-ocr/cnicParser.ts
// Turns raw OCR text from a Pakistani CNIC (Computerized National Identity Card)
// into clean, canonical profile fields.
//
// A CNIC is bilingual: the English side carries labels like "Name", "Father Name",
// "Identity Number", "Date of Birth", "Date of Issue", "Date of Expiry". The free
// English OCR engine reads that side, so we pull the holder's name, date of birth
// and the 13-digit identity number. When OCR.space reads nothing (e.g. an Urdu-only
// or low-quality scan) the route falls back to the Gemini Vision extractor.
//
// Output keys are MasterProfile dot-paths so the values flow through the rest of
// the pipeline (profile merge → autofill) exactly like the passport path. For a
// beneficiary CNIC the merge route remaps these onto MasterProfile.beneficiary.*.

export interface CnicFields {
  "name.first"?: string;
  "name.last"?: string;
  // Full name in Urdu (native alphabet) — DS-260 S01-Q003. The free English OCR
  // can't read the Urdu side, so this is filled by the Gemini Vision fallback.
  nativeFullName?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  cnic?: string; // 00000-0000000-0
}

export interface CnicParseResult {
  fields: CnicFields;
  confidence: Partial<Record<keyof CnicFields, number>>;
  warnings: string[];
  source: "labels" | "partial" | "none";
}

// ─── Date helpers (same conventions as marriageParser) ──────────────────────────

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

/** Find the first parseable date inside a chunk of text → ISO (or null). */
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

// "Date of Birth" only — NOT issue/expiry, which share the "Date of …" prefix and
// would otherwise be mistaken for the DOB.
const DOB_LABEL = /date\s*of\s*birth|^d\.?o\.?b\.?\b/i;

/** Scan from a label for the first date on the same or following lines. */
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

/** Pull the value text written on/after a label line (label stripped). */
function valueNearLabel(lines: string[], labelPattern: RegExp): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!labelPattern.test(lines[i])) continue;
    const sameLine = lines[i].replace(labelPattern, "").replace(/[:.\-]/g, " ").trim();
    if (sameLine.length >= 2) return sameLine;
    if (lines[i + 1] && !/father|husband|identity|number/i.test(lines[i + 1])) {
      return lines[i + 1].trim();
    }
  }
  return null;
}

// The holder's own name. "Father Name" / "Husband Name" sit on their own labelled
// lines, so a bare "Name" label (not preceded by Father/Husband) is the holder.
const NAME_LABEL = /(?<!father\s)(?<!husband\s)\bname\b/i;

/** Split a full name into given (everything but the last token) + family (last token). */
function splitName(full: string): { first?: string; last?: string } {
  const clean = full.replace(/[^A-Za-z\s'.-]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return {};
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 1) return { first: parts[0] };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

// 13-digit CNIC, with or without the canonical dashes (00000-0000000-0).
const CNIC_NUMBER = /\b(\d{5})[-\s]?(\d{7})[-\s]?(\d)\b/;

export function parseCnicText(rawText: string): CnicParseResult {
  const lines = normalizeLines(rawText || "");
  const fields: CnicFields = {};
  const confidence: CnicParseResult["confidence"] = {};
  const warnings: string[] = [];
  let source: CnicParseResult["source"] = "none";

  // 1) Identity number — the most reliable, structured field on the card.
  const joined = lines.join(" ");
  const num = joined.match(CNIC_NUMBER);
  if (num) {
    fields.cnic = `${num[1]}-${num[2]}-${num[3]}`;
    confidence.cnic = 0.85;
    source = "labels";
  }

  // 2) Date of birth (skip issue/expiry).
  const dob = dateNearLabel(lines, DOB_LABEL);
  if (dob) {
    fields.dateOfBirth = dob;
    confidence.dateOfBirth = 0.7;
    source = "labels";
  }

  // 3) Holder name.
  const nameRaw = valueNearLabel(lines, NAME_LABEL);
  if (nameRaw && /[A-Za-z]{2,}/.test(nameRaw) && nameRaw.length <= 60) {
    const { first, last } = splitName(nameRaw);
    if (first) {
      fields["name.first"] = first;
      confidence["name.first"] = 0.55;
    }
    if (last) {
      fields["name.last"] = last;
      confidence["name.last"] = 0.55;
    }
    if (source === "none") source = "partial";
  }

  if (!fields.cnic && !fields.dateOfBirth) {
    warnings.push(
      "We couldn't confidently read this CNIC — please fill in the fields. Tip: a clearer scan of the English side reads best."
    );
  } else if (source === "labels" && (!fields["name.first"] || !fields.dateOfBirth)) {
    source = "partial";
  }

  return { fields, confidence, warnings, source };
}
