// lib/document-ocr/divorceParser.ts
// Turns raw OCR text from a PRIOR-marriage proof (divorce decree / Union Council
// divorce certificate, or a death certificate of a former spouse) into clean,
// canonical profile fields.
//
// The point of this document is twofold:
//   1. Fill the I-130 prior-spouse section (Spouse 2: name + date marriage ended).
//   2. Power the "first marriage" warning — if the user earlier said "this is my
//      first marriage" but this document shows a previous one, the modal flags it.
//
// We only run the free English OCR engine, so we read the English side (or the
// certified translation). Output keys are MasterProfile dot-paths under
// relationship.priorMarriage.* (see types/profile.ts).

export interface DivorceFields {
  "relationship.priorMarriage.spouseName"?: string;
  "relationship.priorMarriage.dateMarriageEnded"?: string; // YYYY-MM-DD
  "relationship.priorMarriage.howEnded"?: string; // "divorce" | "death"
  "relationship.priorMarriage.country"?: string;
}

export interface DivorceParseResult {
  fields: DivorceFields;
  confidence: Partial<Record<keyof DivorceFields, number>>;
  warnings: string[];
  source: "labels" | "single-date" | "none";
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

function valueNearLabel(lines: string[], labelPattern: RegExp): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!labelPattern.test(lines[i])) continue;
    const sameLine = lines[i].replace(labelPattern, "").replace(/[:.\-]/g, " ").trim();
    if (sameLine.length >= 2) return sameLine;
    if (lines[i + 1]) return lines[i + 1].trim();
  }
  return null;
}

function dateNearLabel(lines: string[], labelPattern: RegExp, forwardLines = 6): string | null {
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

function allDates(lines: string[]): string[] {
  const found = new Set<string>();
  for (const line of lines) {
    let rest = line;
    for (let guard = 0; guard < 6 && rest; guard += 1) {
      const d = extractDateFromText(rest);
      if (!d) break;
      found.add(d);
      rest = rest.replace(/\d+/, " ");
    }
  }
  return [...found];
}

function cleanName(full: string): string {
  return full
    .replace(/[^A-Za-z\s'.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Labels ─────────────────────────────────────────────────────────────────────

// "Date of divorce", "divorce effective", "date of death", "deceased on", etc.
const END_DATE_LABEL =
  /(date\s*of\s*(?:divorce|death|dissolution)|(?:divorce|death|dissolution)\s*date|effective\s*(?:date|from)|deceased\s*on|date\s*of\s*talaq)/i;

// The former spouse's name. Divorce certs use "Husband"/"Wife"/"Spouse"/"between";
// death certs use "Name of the Deceased".
const SPOUSE_LABEL =
  /(?:former|previous|ex)\s*(?:spouse|husband|wife)|name\s*of\s*(?:the\s*)?deceased|deceased\s*name|spouse\s*name|husband\s*name|wife\s*name/i;

const COUNTRY_LABEL = /country|nationality|issued\s*in/i;

export function parseDivorceText(rawText: string): DivorceParseResult {
  const lines = normalizeLines(rawText || "");
  const fields: DivorceFields = {};
  const confidence: DivorceParseResult["confidence"] = {};
  const warnings: string[] = [];
  let source: DivorceParseResult["source"] = "none";

  const blob = lines.join(" ").toLowerCase();

  // How the marriage ended — inferred from the document's own wording.
  if (/divorce|talaq|dissolution|khula/.test(blob)) {
    fields["relationship.priorMarriage.howEnded"] = "divorce";
    confidence["relationship.priorMarriage.howEnded"] = 0.6;
    source = "labels";
  } else if (/death|deceased|died/.test(blob)) {
    fields["relationship.priorMarriage.howEnded"] = "death";
    confidence["relationship.priorMarriage.howEnded"] = 0.6;
    source = "labels";
  }

  // Date the marriage ended.
  const endDate = dateNearLabel(lines, END_DATE_LABEL);
  if (endDate) {
    fields["relationship.priorMarriage.dateMarriageEnded"] = endDate;
    confidence["relationship.priorMarriage.dateMarriageEnded"] = 0.5;
    source = "labels";
  } else {
    const dates = allDates(lines);
    if (dates.length === 1) {
      fields["relationship.priorMarriage.dateMarriageEnded"] = dates[0];
      confidence["relationship.priorMarriage.dateMarriageEnded"] = 0.3;
      source = source === "none" ? "single-date" : source;
      warnings.push(
        "We found one date and assumed it is when the marriage ended — please verify it."
      );
    }
  }

  // Former spouse's name.
  const spouseRaw = valueNearLabel(lines, SPOUSE_LABEL);
  if (spouseRaw && /[A-Za-z]{2,}/.test(spouseRaw) && spouseRaw.length <= 60) {
    fields["relationship.priorMarriage.spouseName"] = cleanName(spouseRaw);
    confidence["relationship.priorMarriage.spouseName"] = 0.45;
    if (source === "none") source = "labels";
  }

  // Country (best-effort).
  const countryRaw = valueNearLabel(lines, COUNTRY_LABEL);
  if (countryRaw && /^[A-Za-z .,'-]{3,40}$/.test(countryRaw)) {
    fields["relationship.priorMarriage.country"] = cleanName(countryRaw);
    confidence["relationship.priorMarriage.country"] = 0.4;
  }

  if (Object.keys(fields).length === 0) {
    warnings.push(
      "We couldn't confidently read this document — please fill in the fields. Tip: an English translation reads more reliably."
    );
  }

  return { fields, confidence, warnings, source };
}
