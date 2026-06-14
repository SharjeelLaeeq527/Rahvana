// lib/document-ocr/marriageParser.ts
// Turns raw OCR text from a marriage document into clean, canonical fields.
//
// Handles the IR-1 journey's two civil marriage proofs:
//   - NADRA Marriage Registration Certificate (MRC) — bilingual, has English
//     labels like "Date of Marriage" / "Date of Nikah".
//   - Nikah Nama — mostly Urdu, but the certified ENGLISH TRANSLATION the user
//     uploads carries English labels too.
//
// We only run the free English OCR engine, so we read the English side. The whole
// point of this doc for the journey is the MARRIAGE DATE (relationship.marriageDate),
// which feeds the I-130 / I-130A / DS-260 forms and the consistency widgets. Place
// of marriage is captured best-effort as a bonus.
//
// Output keys are MasterProfile dot-paths (see types/profile.ts → relationship.*)
// so the values flow straight into the rest of the app once saved via /api/profile/merge.

export interface MarriageFields {
  "relationship.marriageDate"?: string; // YYYY-MM-DD
  "relationship.dateOfRegistration"?: string; // YYYY-MM-DD
  "relationship.marriagePlace.city"?: string;
  "relationship.marriagePlace.state"?: string;
  "relationship.marriagePlace.country"?: string;
  "relationship.marriageRegistrationNumber"?: string;
  // Both parties as printed on the certificate. We do NOT decide which one is the
  // visa applicant vs the US sponsor here (the certificate doesn't say), so these
  // are stored faithfully for display + cross-check. The free English OCR rarely
  // reads them cleanly off a two-column bilingual cert — the Gemini Vision fallback
  // fills them reliably.
  "relationship.husbandName"?: string;
  "relationship.husbandFatherName"?: string;
  "relationship.wifeName"?: string;
  "relationship.wifeFatherName"?: string;
}

export interface MarriageParseResult {
  fields: MarriageFields;
  /** 0..1 confidence per field key that was found */
  confidence: Partial<Record<keyof MarriageFields, number>>;
  warnings: string[];
  source: "labels" | "single-date" | "none";
}

// ─── Date helpers (same conventions as passportParser) ──────────────────────────

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

  // Day-first with a month NAME, allowing -/./space separators: "10-MAY-2024",
  // "10 May 2024", "10th May, 2024". (NADRA MRC uses the dashed form.)
  const monthName = text.match(
    /\b(\d{1,2})\s*(?:st|nd|rd|th)?[\s\-\/.]*(?:of[\s\-\/.]*)?(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-\/.,]*(\d{2,4})\b/i
  );
  if (monthName) {
    let year = Number(monthName[3]);
    if (year < 100) year = year >= 40 ? 1900 + year : 2000 + year;
    return toIso(year, MONTHS[monthName[2].toLowerCase()], Number(monthName[1]));
  }

  // Month-name first: "May 10, 2024" / "MAY-10-2024".
  const monthFirst = text.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-\/.,]*(\d{1,2})(?:st|nd|rd|th)?[\s\-\/.,]*(\d{2,4})\b/i
  );
  if (monthFirst) {
    let year = Number(monthFirst[3]);
    if (year < 100) year = year >= 40 ? 1900 + year : 2000 + year;
    return toIso(year, MONTHS[monthFirst[1].toLowerCase()], Number(monthFirst[2]));
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

// Labels that introduce the MARRIAGE date. Deliberately excludes registration /
// issue / print / expiry dates, which also appear on a NADRA MRC and must NOT be
// mistaken for the marriage date.
const MARRIAGE_DATE_LABEL =
  /(date\s*of\s*(?:marriage|nikah|wedding)|(?:marriage|nikah|wedding)\s*date|married\s*on|solemniz)/i;

const PLACE_LABEL = /place\s*of\s*(?:marriage|nikah|wedding)/i;
// NADRA MRC carries a "Registration No" / "MRC No" / "Certificate No".
const REG_NO_LABEL = /(?:registration|reg|mrc|certificate)\s*(?:no|number|#)/i;
// The "Date of Registration" — distinct from the marriage date, near the top of a MRC.
const REG_DATE_LABEL = /(?:date\s*of\s*registration|registration\s*date|registered\s*on)/i;
// A trailing town/province on the place line, or a "Province" / "District" label.
const PROVINCE_LABEL = /province|district|state\b/i;

/** Pull the value text written on/after a label line (label stripped). */
function valueNearLabel(lines: string[], labelPattern: RegExp): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!labelPattern.test(lines[i])) continue;
    const sameLine = lines[i].replace(labelPattern, "").replace(/[:.\-]/g, " ").trim();
    if (sameLine.length >= 2) return sameLine;
    if (lines[i + 1]) return lines[i + 1].trim();
  }
  return null;
}

// In a NADRA MRC the layout is tabular: OCR emits the field LABELS first and the
// VALUES (including the date) several lines later. So after matching the label we
// scan FORWARD for the first parseable date — not just the adjacent lines. The
// marriage label sits in the "Marriage Details" block and its value is the first
// date that follows it (the bride/groom DOBs appear earlier, registration uses a
// different label), so first-date-after-label reliably yields the marriage date.
function dateNearLabel(lines: string[], labelPattern: RegExp, forwardLines = 18): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!labelPattern.test(lines[i])) continue;
    // Inline value first (e.g. "Date of Marriage: 10-MAY-2024").
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

/** Collect every distinct date in the document (used for the single-date fallback). */
function allDates(lines: string[]): string[] {
  const found = new Set<string>();
  for (const line of lines) {
    // Pull dates one at a time by chopping the line as matches are consumed.
    let rest = line;
    for (let guard = 0; guard < 6 && rest; guard += 1) {
      const d = extractDateFromText(rest);
      if (!d) break;
      found.add(d);
      // Advance past the first number so we don't re-match the same date.
      rest = rest.replace(/\d+/, " ");
    }
  }
  return [...found];
}

// ─── Public entry point ───────────────────────────────────────────────────────────

export function parseMarriageText(rawText: string): MarriageParseResult {
  const lines = normalizeLines(rawText || "");
  const fields: MarriageFields = {};
  const confidence: MarriageParseResult["confidence"] = {};
  const warnings: string[] = [];
  let source: MarriageParseResult["source"] = "none";

  // 1) Preferred: a date sitting next to a marriage/nikah label.
  const labelled = dateNearLabel(lines, MARRIAGE_DATE_LABEL);
  if (labelled) {
    fields["relationship.marriageDate"] = labelled;
    confidence["relationship.marriageDate"] = 0.65;
    source = "labels";
  } else {
    // 2) Fallback: if the document has exactly ONE date, assume it's the marriage
    //    date (low confidence) and ask the user to verify. With 0 or 2+ dates we
    //    can't tell which is which, so leave it blank for manual entry.
    const dates = allDates(lines);
    if (dates.length === 1) {
      fields["relationship.marriageDate"] = dates[0];
      confidence["relationship.marriageDate"] = 0.35;
      source = "single-date";
      warnings.push(
        "We found one date and assumed it is the marriage date — please verify it before saving."
      );
    }
  }

  if (!fields["relationship.marriageDate"]) {
    warnings.push(
      "Marriage date was not confidently detected — please fill it in. Tip: an English translation reads more reliably."
    );
  }

  // 3) Place of marriage (bonus, best-effort). City only — country is unreliable.
  const place = valueNearLabel(lines, PLACE_LABEL);
  if (place && /[A-Za-z]{2,}/.test(place) && place.length <= 60) {
    fields["relationship.marriagePlace.city"] = place.replace(/\s+/g, " ").trim();
    confidence["relationship.marriagePlace.city"] = 0.45;
    if (source === "none") source = "labels";
  }

  // 3b) Province/state of marriage (e.g. "Punjab", "Sindh") — best-effort.
  const province = valueNearLabel(lines, PROVINCE_LABEL);
  if (province && /^[A-Za-z .,'-]{2,40}$/.test(province)) {
    fields["relationship.marriagePlace.state"] = province.replace(/\s+/g, " ").trim();
    confidence["relationship.marriagePlace.state"] = 0.4;
    if (source === "none") source = "labels";
  }

  // 3c) Date of registration (distinct from the marriage date) — best-effort.
  const regDate = dateNearLabel(lines, REG_DATE_LABEL, 3);
  if (regDate) {
    fields["relationship.dateOfRegistration"] = regDate;
    confidence["relationship.dateOfRegistration"] = 0.5;
    if (source === "none") source = "labels";
  }

  // 4) Registration / MRC / certificate number — structured on a NADRA MRC.
  // The value MUST look like an ID (contain digits): a NADRA reg no is like
  // "22102-9876543-2". Requiring a digit stops the parser grabbing a heading word
  // such as "GOVERNMENT" off a noisy two-column OCR read.
  const regRaw = valueNearLabel(lines, REG_NO_LABEL);
  if (regRaw) {
    const m = regRaw.match(/\b\d[\dA-Za-z]*(?:[\-\/][\dA-Za-z]+)+\b|\b\d{6,}\b/);
    if (m) {
      fields["relationship.marriageRegistrationNumber"] = m[0].toUpperCase();
      confidence["relationship.marriageRegistrationNumber"] = 0.5;
      if (source === "none") source = "labels";
    }
  }

  return { fields, confidence, warnings, source };
}
