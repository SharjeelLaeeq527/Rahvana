// Define document types and their validation requirements
export type DocumentType =
  | "passport"
  | "nikah_nama"
  | "birth_certificate"
  | "marriage_certificate"
  | "divorce_certificate"
  | "death_certificate"
  | "police_certificate"
  | "medical_examination"
  | "i864_affidavit"
  | "translation"
  | "irs_transcript"
  | "form_1040"
  | "w2"
  | "form_1099";

export interface DocumentValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  score: number; // 0-100
  extractedData?: Record<
    string,
    string | number | boolean | string[] | number[] | boolean[] | Date | Date[] | null | undefined
  >;
}

export interface ValidationIssue {
  severity: "critical" | "warning" | "info";
  message: string;
  suggestion: string;
}

// Define keyword structure with mandatory and optional keywords
interface DocumentKeywords {
  mandatory: string[]; // Must match at least 1 of these
  optional: string[]; // Must match at least 3 of these
}

// Helper for fuzzy string matching (Levenshtein distance based)
const fuzzyContains = (text: string, keyword: string, maxDistance: number = 1): boolean => {
  // exact match check first for performance
  if (text.includes(keyword)) return true;

  // If text is very short, don't fuzzy match
  if (text.length < keyword.length) return false;

  // Simple sliding window fuzzy match
  const textLen = text.length;
  const keyLen = keyword.length;

  for (let i = 0; i <= textLen - keyLen; i++) {
    const sub = text.substr(i, keyLen);
    let distance = 0;
    for (let j = 0; j < keyLen; j++) {
      if (sub[j] !== keyword[j]) distance++;
      if (distance > maxDistance) break;
    }
    if (distance <= maxDistance) return true;
  }
  return false;
};

// Function to check if the document is of the correct type
export const checkDocumentType = (
  text: string,
  type: DocumentType
): { isValid: boolean; reason?: string; matchedKeywords?: string[] } => {
  // Define keywords for each document type with mandatory and optional
  const typeKeywords: Record<DocumentType, DocumentKeywords> = {
    passport: {
      mandatory: [
        "PASSPORT",
        "REPUBLIC",
        "UNITED STATES",
        "PAKISTAN",
        "INDIA",
        "BANGLADESH",
        "TRAVEL DOCUMENT",
      ],
      optional: [
        "SURNAME",
        "GIVEN NAME",
        "NATIONALITY",
        "DATE OF BIRTH",
        "SEX",
        "PLACE OF BIRTH",
        "AUTHORITY",
        "EXPIRY",
        "ISSUED",
        "P<",
      ],
    },
    nikah_nama: {
      mandatory: ["NIKAH", "MARRIAGE", "UNION COUNCIL"],
      optional: [
        "BRIDE",
        "GROOM",
        "QAZI",
        "WITNESS",
        "MAHR",
        "WALIMA",
        "HUSBAND",
        "WIFE",
        "REGISTRATION",
      ],
    },
    birth_certificate: {
      mandatory: ["BIRTH", "CERTIFICATE", "LIVE BIRTH"],
      optional: ["FATHER", "MOTHER", "REGISTRATION", "REGISTRAR", "VITAL", "BORN", "SEX", "DATE"],
    },
    marriage_certificate: {
      mandatory: ["MARRIAGE", "CERTIFICATE", "WEDDING"],
      optional: ["HUSBAND", "WIFE", "OFFICIANT", "MINISTER", "WITNESS", "VITAL", "GROOM", "BRIDE"],
    },
    divorce_certificate: {
      mandatory: ["DIVORCE", "DECREE", "DISSOLUTION"],
      optional: ["PETITIONER", "RESPONDENT", "PLAINTIFF", "DEFENDANT", "COURT", "JUDGE", "FINAL"],
    },
    death_certificate: {
      mandatory: ["DEATH", "CERTIFICATE"],
      optional: ["DECEASED", "DECEDENT", "CAUSE", "REGISTRAR", "VITAL", "DIED"],
    },
    police_certificate: {
      mandatory: ["POLICE", "CLEARANCE", "CHARACTER", "CRIMINAL"],
      optional: ["RECORD", "CONDUCT", "DEPARTMENT", "HISTORY", "CHECK", "INSPECTOR"],
    },
    medical_examination: {
      mandatory: ["MEDICAL", "EXAMINATION", "I-693", "VACCINATION"],
      optional: ["PHYSICIAN", "SURGEON", "USCIS", "IMMUNIZATION", "HEALTH", "CLINIC"],
    },
    i864_affidavit: {
      mandatory: ["I-864", "AFFIDAVIT", "SUPPORT"],
      optional: ["SPONSOR", "PETITIONER", "BENEFICIARY", "INCOME", "HOUSEHOLD", "ASSETS"],
    },
    translation: {
      mandatory: ["TRANSLATION", "TRANSLATOR", "CERTIFIED"],
      optional: ["SWORN", "ACCURATE", "LANGUAGE", "ENGLISH", "URDU", "ATTEST"],
    },
    irs_transcript: {
      mandatory: ["IRS", "REVENUE", "TRANSCRIPT"],
      optional: ["TAX", "1040", "INCOME", "FILING", "RETURN", "AGI"],
    },
    form_1040: {
      mandatory: ["1040", "TAX RETURN"],
      optional: ["IRS", "INCOME", "DEDUCTION", "REFUND", "TAX", "FILING"],
    },
    w2: {
      mandatory: ["W-2", "WAGE"],
      optional: ["EMPLOYER", "EMPLOYEE", "TAX", "SECURITY", "MEDICARE", "TIPS"],
    },
    form_1099: {
      mandatory: ["1099"],
      optional: ["PAYER", "RECIPIENT", "INCOME", "COMPENSATION", "INTEREST"],
    },
  };

  const keywords = typeKeywords[type];
  if (!keywords) {
    return { isValid: false, reason: "Unknown document type" };
  }

  // Check for mandatory keywords (at least 1 must match) - using fuzzy match
  // Allow 1 char error for short words (<5), 2 chars for longer
  const foundMandatory = keywords.mandatory.filter((keyword) => {
    const tolerance = keyword.length > 5 ? 2 : 1;
    return fuzzyContains(text, keyword, tolerance);
  });

  if (foundMandatory.length === 0) {
    return {
      isValid: false,
      reason: `Document is missing required identifier for ${type.replace("_", " ")}. We looked for: ${keywords.mandatory.join(", ")}`,
      matchedKeywords: [],
    };
  }

  // Check for optional keywords (at least 2 must match) - using fuzzy match
  const foundOptional = keywords.optional.filter((keyword) => {
    const tolerance = keyword.length > 5 ? 2 : 1;
    return fuzzyContains(text, keyword, tolerance);
  });

  // Special case for passports: if we found "PASSPORT" and at least 1 other key field like "SURNAME" or "NATIONALITY", it's likely valid
  const minOptional = type === "passport" ? 1 : 2;

  if (foundOptional.length < minOptional) {
    const missingCount = minOptional - foundOptional.length;
    return {
      isValid: false,
      reason: `Document looks like a ${type.replace("_", " ")} but is missing ${missingCount} more supporting details. We found: ${foundOptional.join(", ") || "none"}. We need at least ${minOptional} of: ${keywords.optional.join(", ")}`,
      matchedKeywords: [...foundMandatory, ...foundOptional],
    };
  }

  // Check for conflicting document types (exclusion logic)
  const conflictingType = detectConflictingDocumentType(text, type, typeKeywords);
  if (conflictingType) {
    return {
      isValid: false,
      reason: `Document appears to be a ${conflictingType.replace("_", " ")} instead of ${type.replace("_", " ")}`,
      matchedKeywords: [...foundMandatory, ...foundOptional],
    };
  }

  // All checks passed
  return {
    isValid: true,
    matchedKeywords: [...foundMandatory, ...foundOptional],
  };
};

// Helper function to detect if document matches a different type more strongly
const detectConflictingDocumentType = (
  text: string,
  expectedType: DocumentType,
  allKeywords: Record<DocumentType, DocumentKeywords>
): DocumentType | null => {
  const scores: Record<string, number> = {};

  // Score each document type based on mandatory + optional keyword matches
  Object.entries(allKeywords).forEach(([docType, keywords]) => {
    if (docType === expectedType) return; // Skip the expected type

    const mandatoryMatches = keywords.mandatory.filter((k) =>
      text.includes(k.toUpperCase())
    ).length;
    const optionalMatches = keywords.optional.filter((k) => text.includes(k.toUpperCase())).length;

    // Mandatory keywords are weighted more heavily
    scores[docType] = mandatoryMatches * 5 + optionalMatches;
  });

  // If any other document type has a strong match (score >= 8), consider it conflicting
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore >= 8) {
    const conflictingType = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
    return conflictingType as DocumentType;
  }

  return null;
};

// Validate based on document type
export const validateByDocumentType = (
  text: string,
  type: DocumentType
): DocumentValidationResult => {
  // Check if the OCR extracted text is substantial enough to be valid
  if (!text || text.trim().length < 50) {
    return {
      isValid: false,
      issues: [
        {
          severity: "critical",
          message: "Document appears to have insufficient text content",
          suggestion:
            "Document may be blank, corrupted, or OCR failed to extract text. Please try uploading a clearer image.",
        },
      ],
      score: 0,
    };
  }

  // Convert text to uppercase for easier pattern matching
  const upperText = text.toUpperCase();

  // First, check if the document contains keywords that indicate it's the correct type
  const typeCheckResult = checkDocumentType(upperText, type);

  if (!typeCheckResult.isValid) {
    return {
      isValid: false,
      issues: [
        {
          severity: "critical",
          message:
            typeCheckResult.reason ||
            `Uploaded document does not appear to be a ${type.replace("_", " ")}`,
          suggestion: "Please upload the correct document type for validation",
        },
      ],
      score: 0,
      extractedData: {
        matchedKeywords: typeCheckResult.matchedKeywords || [],
        textLength: text.length,
      },
    };
  }

  // Document type is correct, now validate specific requirements
  switch (type) {
    case "passport":
      return validatePassport(upperText);
    case "nikah_nama":
      return validateNikahNama(upperText);
    case "birth_certificate":
      return validateBirthCertificate(upperText);
    case "marriage_certificate":
      return validateMarriageCertificate(upperText);
    case "divorce_certificate":
      return validateDivorceCertificate(upperText);
    case "death_certificate":
      return validateDeathCertificate(upperText);
    case "police_certificate":
      return validatePoliceCertificate(upperText);
    case "medical_examination":
      return validateMedicalExamination(upperText);
    case "i864_affidavit":
      return validateI864Affidavit(upperText);
    case "translation":
      return validateTranslation(upperText);
    case "irs_transcript":
      return validateIrsTranscript(upperText);
    case "form_1040":
      return validateForm1040(upperText);
    case "w2":
      return validateW2(upperText);
    case "form_1099":
      return validate1099(upperText);
    default:
      return {
        isValid: false,
        issues: [
          {
            severity: "critical",
            message: "Unknown document type",
            suggestion: "Please select a valid document type",
          },
        ],
        score: 0,
      };
  }
};

// Helper to extract all potential dates from text
const extractAllDates = (text: string): Date[] => {
  const dates: Date[] = [];

  // Regex patterns for various date formats - relaxed for OCR noise
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g, // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g, // YYYY/MM/DD
    /(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/g, // DD MMM YYYY (e.g. 12 JAN 2025)
    /([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/g, // MMM DD, YYYY
    /(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{2})/g, // DD MMM YY (e.g. 12 JAN 25)
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})/g, // DD/MM/YY (Riskier, but needed)
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        // Try to parse the date
        const dateStr = match[0].replace(/[\.\-]/g, "/"); // Normalize separators
        const date = new Date(dateStr);

        // Check if valid date
        if (!isNaN(date.getTime())) {
          // Filter out unreasonable years (e.g. year 1900 or 2100+)
          const year = date.getFullYear();
          // Handle 2-digit years (00-99) -> 2000-2099 assumption for expiry
          if (year < 100) {
            date.setFullYear(2000 + year);
          }

          if (date.getFullYear() >= 1950 && date.getFullYear() <= 2050) {
            dates.push(date);
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  });

  return dates;
};

// Passport validation
const validatePassport = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  // Check for essential elements - using fuzzy matching
  if (!fuzzyContains(text, "PASSPORT", 2)) {
    issues.push({
      severity: "warning",
      message: "Passport designation not found",
      suggestion: "Ensure the document is clearly marked as a passport",
    });
  }

  // Passport Number Check
  const hasPassportNum =
    fuzzyContains(text, "PASSPORT NO", 2) ||
    fuzzyContains(text, "PASSPORT NUMBER", 2) ||
    text.match(/[A-Z]{1,2}[0-9]{6,9}/); // Common passport number pattern

  if (!hasPassportNum) {
    issues.push({
      severity: "critical",
      message: "Passport number not found",
      suggestion: "Verify that the passport number is visible and legible",
    });
  }

  // Name Check
  const hasName =
    fuzzyContains(text, "SURNAME", 2) ||
    fuzzyContains(text, "GIVEN NAME", 2) ||
    fuzzyContains(text, "FULL NAME", 2) ||
    text.includes("NAME");

  if (!hasName) {
    issues.push({
      severity: "critical",
      message: "Name not found",
      suggestion: "Verify that the name is visible and legible",
    });
  }

  // Nationality Check
  const hasNationality =
    fuzzyContains(text, "NATIONALITY", 2) ||
    fuzzyContains(text, "CITIZENSHIP", 2) ||
    fuzzyContains(text, "REPUBLIC", 2); // Often appears near nationality

  if (!hasNationality) {
    issues.push({
      severity: "warning",
      message: "Nationality not found",
      suggestion: "Verify that the nationality is visible",
    });
  }

  // DOB Check
  const hasDOB =
    fuzzyContains(text, "DATE OF BIRTH", 2) ||
    fuzzyContains(text, "BIRTH DATE", 2) ||
    fuzzyContains(text, "DOB", 1) ||
    text.match(/\d{2}\s+[A-Z]{3}\s+\d{4}/); // Date pattern like 12 JAN 1990

  if (!hasDOB) {
    issues.push({
      severity: "critical",
      message: "Date of birth not found",
      suggestion: "Verify that the date of birth is visible and legible",
    });
  }

  // Expiry Check
  let hasExpiry =
    fuzzyContains(text, "EXPIRY DATE", 2) ||
    fuzzyContains(text, "DATE OF EXPIRY", 2) ||
    fuzzyContains(text, "VALID UNTIL", 2) ||
    fuzzyContains(text, "EXPIRES", 2) ||
    fuzzyContains(text, "EXPIRATION", 2) ||
    fuzzyContains(text, "VALID TO", 2) ||
    fuzzyContains(text, "VALID THRU", 2);

  const allDates = extractAllDates(text);
  const currentDate = new Date();

  // Find any future date
  const futureDate = allDates.find((date) => date > currentDate);

  // MRZ Parsing Strategy (Machine Readable Zone)
  // Look for pattern: [DOB 6 digits][Check digit][Sex][Expiry 6 digits]
  // Example: 8105299M2004275 -> DOB 810529, Sex M, Expiry 200427
  // Note: We removed \b because often the country code (e.g. GHA) is immediately before the DOB without a space
  const mrzMatch = text.match(/(\d{6})\d[MF<](\d{6})\d/);
  if (mrzMatch) {
    const expiryStr = mrzMatch[2]; // YYMMDD
    const year = parseInt(expiryStr.substring(0, 2));
    const month = parseInt(expiryStr.substring(2, 4)) - 1; // 0-indexed
    const day = parseInt(expiryStr.substring(4, 6));

    // Assumption: MRZ years are 2000+ for now (or handle 1900s if needed, but passports expire so usually 2000+)
    // Standard logic: if year > 50 assume 19xx, else 20xx. But for expiry, it's usually future or recent past.
    // Let's assume 20xx for expiry to be safe for current passports.
    const fullYear = 2000 + year;

    const mrzDate = new Date(fullYear, month, day);
    if (!isNaN(mrzDate.getTime())) {
      allDates.push(mrzDate);
      hasExpiry = true; // We found the expiry field in the MRZ!
    }
  }

  // Fallback: If no label found but we found a future date, assume valid
  if (!hasExpiry && futureDate) {
    hasExpiry = true;
  }

  if (!hasExpiry) {
    issues.push({
      severity: "critical",
      message: "Expiry date not found",
      suggestion: "Verify that the expiry date is visible and legible",
    });
  } else {
    // Check if passport is expired (if we found specific dates)
    // If we only found "hasExpiry" via label but couldn't parse date, we assume valid to avoid false positives
    // But if we found explicit dates, we should check them

    // If we found a future date, we are good.
    // If ALL dates found are in the past, then it's expired.
    if (allDates.length > 0) {
      const hasFutureDate = allDates.some((date) => date > currentDate);
      if (!hasFutureDate) {
        issues.push({
          severity: "critical",
          message: "Passport appears to be expired",
          suggestion: "You need a valid passport for your visa application",
        });
      }
    }
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// Nikah Nama validation (special handling for Urdu documents)
const validateNikahNama = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  // Since Nikah Nama is often in Urdu, OCR might not capture everything well
  // So we'll provide a checklist-based validation instead of pure OCR

  // Check for common English terms that might appear
  if (!text.includes("NIKAH") && !text.includes("MARRIAGE")) {
    issues.push({
      severity: "info",
      message: "Nikah/Marriage term not found in English",
      suggestion: "This is common for Urdu documents. Verify manually that this is a Nikah Nama",
    });
  }

  // For Urdu documents, we recommend manual verification
  issues.push({
    severity: "info",
    message: "Urdu document detected - manual verification recommended",
    suggestion:
      "Please verify: 1) Names of bride and groom 2) Date of marriage 3) Signature of Nikah Khwan 4) Witnesses' names and signatures 5) Official seal",
  });

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// Birth certificate validation
const validateBirthCertificate = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  // Check for essential elements - using fuzzy matching
  if (!fuzzyContains(text, "BIRTH", 2) && !fuzzyContains(text, "CERTIFICATE", 2)) {
    issues.push({
      severity: "warning",
      message: "Birth certificate designation not found",
      suggestion: "Ensure the document is clearly marked as a birth certificate",
    });
  }

  if (!fuzzyContains(text, "NAME", 2) && !fuzzyContains(text, "FULL NAME", 2)) {
    issues.push({
      severity: "critical",
      message: "Name not found",
      suggestion: "Verify that the full name is visible and legible",
    });
  }

  if (
    !fuzzyContains(text, "DATE OF BIRTH", 2) &&
    !fuzzyContains(text, "DOB", 1) &&
    !fuzzyContains(text, "BIRTH DATE", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Date of birth not found",
      suggestion: "Verify that the date of birth is visible and legible",
    });
  }

  if (
    !fuzzyContains(text, "PLACE OF BIRTH", 2) &&
    !fuzzyContains(text, "BIRTH PLACE", 2) &&
    !fuzzyContains(text, "BORN IN", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Place of birth not found",
      suggestion: "Verify that the place of birth is visible",
    });
  }

  if (!fuzzyContains(text, "FATHER", 2) && !fuzzyContains(text, "PATERNAL", 2)) {
    issues.push({
      severity: "warning",
      message: "Father's name not found",
      suggestion: "Verify that the father's name is visible",
    });
  }

  if (!fuzzyContains(text, "MOTHER", 2) && !fuzzyContains(text, "MATERNAL", 2)) {
    issues.push({
      severity: "warning",
      message: "Mother's name not found",
      suggestion: "Verify that the mother's name is visible",
    });
  }

  if (
    !fuzzyContains(text, "REGISTRATION", 2) &&
    !fuzzyContains(text, "REGISTERED", 2) &&
    !fuzzyContains(text, "CERTIFIED", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Registration status not found",
      suggestion: "Verify this is a certified/registered birth certificate",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// Marriage certificate validation
const validateMarriageCertificate = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (!fuzzyContains(text, "MARRIAGE", 2) && !fuzzyContains(text, "CERTIFICATE", 2)) {
    issues.push({
      severity: "warning",
      message: "Marriage certificate designation not found",
      suggestion: "Ensure the document is clearly marked as a marriage certificate",
    });
  }

  if (
    !fuzzyContains(text, "HUSBAND", 2) &&
    !fuzzyContains(text, "SPOUSE", 2) &&
    !fuzzyContains(text, "GROOM", 2) &&
    !fuzzyContains(text, "WIFE", 2) &&
    !fuzzyContains(text, "BRIDE", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Names of spouses not found",
      suggestion: "Verify that both spouses' names are visible and legible",
    });
  }

  if (
    !fuzzyContains(text, "DATE OF MARRIAGE", 2) &&
    !fuzzyContains(text, "MARRIAGE DATE", 2) &&
    !fuzzyContains(text, "WEDDING DATE", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Date of marriage not found",
      suggestion: "Verify that the date of marriage is visible and legible",
    });
  }

  if (
    !fuzzyContains(text, "OFFICIANT", 2) &&
    !fuzzyContains(text, "MINISTER", 2) &&
    !fuzzyContains(text, "PRIEST", 2) &&
    !fuzzyContains(text, "IMAM", 2) &&
    !fuzzyContains(text, "NIKAH KHAWAN", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Officiant not found",
      suggestion: "Verify that the officiant's name is visible",
    });
  }

  if (
    !fuzzyContains(text, "WITNESS", 2) &&
    !fuzzyContains(text, "ATTEST", 2) &&
    !fuzzyContains(text, "SIGNATURE", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Witness signatures not found",
      suggestion: "Verify that witness signatures are present",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// Divorce certificate validation
const validateDivorceCertificate = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (
    !fuzzyContains(text, "DIVORCE", 2) &&
    !fuzzyContains(text, "DECREE", 2) &&
    !fuzzyContains(text, "DISSOLUTION", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Divorce designation not found",
      suggestion: "Ensure the document is clearly marked as a divorce decree",
    });
  }

  if (
    !fuzzyContains(text, "PETITIONER", 2) &&
    !fuzzyContains(text, "PLAINTIFF", 2) &&
    !fuzzyContains(text, "RESPONDENT", 2) &&
    !fuzzyContains(text, "DEFENDANT", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Parties to divorce not found",
      suggestion: "Verify that both parties' names are visible",
    });
  }

  if (
    !fuzzyContains(text, "DATE OF DIVORCE", 2) &&
    !fuzzyContains(text, "DIVORCE DATE", 2) &&
    !fuzzyContains(text, "FINALIZED", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Date of divorce not found",
      suggestion: "Verify that the date of divorce is visible and legible",
    });
  }

  if (
    !fuzzyContains(text, "COURT", 2) &&
    !fuzzyContains(text, "JUDGE", 2) &&
    !fuzzyContains(text, "COMMISSIONER", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Court authorization not found",
      suggestion: "Verify this is an official court document with judge's signature",
    });
  }

  if (
    !fuzzyContains(text, "CASE NUMBER", 2) &&
    !fuzzyContains(text, "DOCKET", 2) &&
    !fuzzyContains(text, "FILE NUMBER", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Case number not found",
      suggestion: "Verify that the case number is visible",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// Death certificate validation
const validateDeathCertificate = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (!fuzzyContains(text, "DEATH", 2) && !fuzzyContains(text, "CERTIFICATE", 2)) {
    issues.push({
      severity: "warning",
      message: "Death certificate designation not found",
      suggestion: "Ensure the document is clearly marked as a death certificate",
    });
  }

  if (
    !fuzzyContains(text, "DECEASED", 2) &&
    !fuzzyContains(text, "DECEDENT", 2) &&
    !fuzzyContains(text, "DEATH OF", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Deceased person's name not found",
      suggestion: "Verify that the deceased person's name is visible and legible",
    });
  }

  if (
    !fuzzyContains(text, "DATE OF DEATH", 2) &&
    !fuzzyContains(text, "DEATH DATE", 2) &&
    !fuzzyContains(text, "DIED ON", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Date of death not found",
      suggestion: "Verify that the date of death is visible and legible",
    });
  }

  if (
    !fuzzyContains(text, "PLACE OF DEATH", 2) &&
    !fuzzyContains(text, "DEATH PLACE", 2) &&
    !fuzzyContains(text, "DIED IN", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Place of death not found",
      suggestion: "Verify that the place of death is visible",
    });
  }

  if (
    !fuzzyContains(text, "CAUSE OF DEATH", 2) &&
    !fuzzyContains(text, "CAUSE", 2) &&
    !fuzzyContains(text, "REASON FOR DEATH", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Cause of death not found",
      suggestion: "Verify that the cause of death is visible (may be redacted for privacy)",
    });
  }

  if (
    !fuzzyContains(text, "REGISTRAR", 2) &&
    !fuzzyContains(text, "AUTHORITY", 2) &&
    !fuzzyContains(text, "ISSUED BY", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Issuing authority not found",
      suggestion: "Verify this is an official document from the vital records office",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// Police certificate validation
const validatePoliceCertificate = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (
    !fuzzyContains(text, "POLICE", 2) &&
    !fuzzyContains(text, "CLEARANCE", 2) &&
    !fuzzyContains(text, "CERTIFICATE", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Police certificate designation not found",
      suggestion: "Ensure the document is clearly marked as a police clearance certificate",
    });
  }

  if (
    !fuzzyContains(text, "NAME", 2) &&
    !fuzzyContains(text, "FULL NAME", 2) &&
    !fuzzyContains(text, "SUBJECT", 2) &&
    !fuzzyContains(text, "APPLICANT", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Applicant name not found",
      suggestion: "Verify that the applicant's name is visible and legible",
    });
  }

  if (
    !fuzzyContains(text, "DATE", 2) &&
    !fuzzyContains(text, "ISSUE DATE", 2) &&
    !fuzzyContains(text, "ISSUED ON", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Issue date not found",
      suggestion: "Verify that the issue date is visible and legible",
    });
  }

  if (
    !fuzzyContains(text, "NO RECORD", 2) &&
    !fuzzyContains(text, "CLEARED", 2) &&
    !fuzzyContains(text, "GOOD STANDING", 2) &&
    !fuzzyContains(text, "NO CRIMINAL RECORD", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Clearance status not found",
      suggestion: "Verify that the certificate indicates criminal record status",
    });
  }

  if (
    !fuzzyContains(text, "AUTHORITY", 2) &&
    !fuzzyContains(text, "ISSUED BY", 2) &&
    !fuzzyContains(text, "DEPARTMENT", 2) &&
    !fuzzyContains(text, "AGENCY", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Issuing authority not found",
      suggestion: "Verify this is an official document from a recognized authority",
    });
  }

  // Check if certificate is expired (police certificates often have expiration)
  const issueMatch = text.match(
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})|(\d{4}[\/\-]\d{2}[\/\-]\d{2})|(\d{2}[\/\-]\d{2}[\/\-]\d{2})/
  );
  if (issueMatch) {
    const issueDateStr = issueMatch[0];
    const issueDate = new Date(issueDateStr.replace(/[\/\-]/g, "/"));
    const currentDate = new Date();

    // Police certificates are often valid for 1 year
    const oneYearFromIssue = new Date(issueDate);
    oneYearFromIssue.setFullYear(oneYearFromIssue.getFullYear() + 1);

    if (currentDate > oneYearFromIssue) {
      issues.push({
        severity: "warning",
        message: "Police certificate may be expired (older than 1 year)",
        suggestion: "Consider obtaining a newer certificate if yours is older than 1 year",
      });
    }
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// Medical examination validation
const validateMedicalExamination = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (
    !fuzzyContains(text, "MEDICAL", 2) &&
    !fuzzyContains(text, "PHYSICIAN", 2) &&
    !fuzzyContains(text, "EXAMINATION", 2) &&
    !fuzzyContains(text, "EXAM", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Medical examination designation not found",
      suggestion: "Ensure the document is clearly marked as a medical examination report",
    });
  }

  if (
    !fuzzyContains(text, "FORM I-693", 2) &&
    !fuzzyContains(text, "I-693", 2) &&
    !fuzzyContains(text, "MEDICAL REPORT", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Form I-693 designation not found",
      suggestion: "Verify this is a Form I-693 Report of Medical Examination",
    });
  }

  if (
    !fuzzyContains(text, "PHYSICIAN", 2) &&
    !fuzzyContains(text, "DOCTOR", 2) &&
    !fuzzyContains(text, "MEDICAL OFFICER", 2) &&
    !fuzzyContains(text, "PANEL PHYSICIAN", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Examining physician not found",
      suggestion: "Verify that the examining physician's name and credentials are visible",
    });
  }

  if (
    !fuzzyContains(text, "VACCINATION", 2) &&
    !fuzzyContains(text, "VACCINE", 2) &&
    !fuzzyContains(text, "IMMUNIZATION", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Vaccination status not found",
      suggestion: "Verify that vaccination records are included",
    });
  }

  if (
    !fuzzyContains(text, "CLASSIFICATION", 2) &&
    !fuzzyContains(text, "CLASS", 2) &&
    !fuzzyContains(text, "INELIGIBLE", 2) &&
    !fuzzyContains(text, "ELIGIBLE", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Medical eligibility determination not found",
      suggestion: "Verify that the medical officer's determination is visible",
    });
  }

  if (
    !fuzzyContains(text, "DATE", 2) &&
    !fuzzyContains(text, "EXAM DATE", 2) &&
    !fuzzyContains(text, "EXAMINED ON", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Examination date not found",
      suggestion: "Verify that the examination date is visible and legible",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// I-864 Affidavit validation
const validateI864Affidavit = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (
    !fuzzyContains(text, "I-864", 2) &&
    !fuzzyContains(text, "AFFIDAVIT", 2) &&
    !fuzzyContains(text, "SUPPORT", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Form I-864 designation not found",
      suggestion: "Verify this is Form I-864 Affidavit of Support",
    });
  }

  if (!fuzzyContains(text, "SPONSOR", 2) && !fuzzyContains(text, "PETITIONER", 2)) {
    issues.push({
      severity: "critical",
      message: "Sponsor information not found",
      suggestion: "Verify that the sponsor's information is visible",
    });
  }

  if (
    !fuzzyContains(text, "BENEFICIARY", 2) &&
    !fuzzyContains(text, "IMMIGRANT", 2) &&
    !fuzzyContains(text, "APPLICANT", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Beneficiary information not found",
      suggestion: "Verify that the beneficiary's information is visible",
    });
  }

  if (
    !fuzzyContains(text, "INCOME", 2) &&
    !fuzzyContains(text, "TAX RETURN", 2) &&
    !fuzzyContains(text, "W-2", 2) &&
    !fuzzyContains(text, "1040", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Income evidence not found",
      suggestion: "Verify that supporting income documents are attached",
    });
  }

  if (
    !fuzzyContains(text, "SIGNATURE", 2) &&
    !fuzzyContains(text, "SIGNED", 2) &&
    !fuzzyContains(text, "SUBSCRIBED", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Signature not found",
      suggestion: "Verify that the sponsor's signature is present",
    });
  }

  if (
    !fuzzyContains(text, "DATE", 2) &&
    !fuzzyContains(text, "SIGNED ON", 2) &&
    !fuzzyContains(text, "DATED", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Signature date not found",
      suggestion: "Verify that the signature date is visible",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// Translation document validation
const validateTranslation = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (
    !fuzzyContains(text, "TRANSLATION", 2) &&
    !fuzzyContains(text, "TRANSLATED FROM", 2) &&
    !fuzzyContains(text, "TRANSLATED TO", 2)
  ) {
    issues.push({
      severity: "info",
      message: "Translation designation not found",
      suggestion: "Ensure the document is clearly marked as a translation",
    });
  }

  if (
    !fuzzyContains(text, "CERTIFIED", 2) &&
    !fuzzyContains(text, "SWORN", 2) &&
    !fuzzyContains(text, "ACKNOWLEDGED", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Certification not found",
      suggestion: "Verify this is a certified translation by a qualified translator",
    });
  }

  if (
    !fuzzyContains(text, "TRANSLATOR", 2) &&
    !fuzzyContains(text, "INTERPRETER", 2) &&
    !fuzzyContains(text, "CERTIFY", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Translator identification not found",
      suggestion: "Verify that the translator's name and credentials are visible",
    });
  }

  if (
    !fuzzyContains(text, "SIGNATURE", 2) &&
    !fuzzyContains(text, "SIGNED", 2) &&
    !fuzzyContains(text, "CERTIFIED CORRECT", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Translator signature not found",
      suggestion: "Verify that the translator's signature is present",
    });
  }

  if (
    !fuzzyContains(text, "DATE", 2) &&
    !fuzzyContains(text, "TRANSLATED ON", 2) &&
    !fuzzyContains(text, "CERTIFIED ON", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Translation date not found",
      suggestion: "Verify that the translation date is visible",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// IRS Tax Transcript validation
const validateIrsTranscript = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (
    !fuzzyContains(text, "IRS", 2) &&
    !fuzzyContains(text, "TRANSCRIPT", 2) &&
    !fuzzyContains(text, "INTERNAL REVENUE SERVICE", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "IRS Transcript designation not found",
      suggestion: "Verify this is an official IRS Tax Transcript",
    });
  }

  if (
    !fuzzyContains(text, "SSN", 2) &&
    !fuzzyContains(text, "SOCIAL SECURITY NUMBER", 2) &&
    !fuzzyContains(text, "TAX YEAR", 2) &&
    !fuzzyContains(text, "YEAR", 2) &&
    !text.match(/FORM \d{4}/)
  ) {
    issues.push({
      severity: "critical",
      message: "Taxpayer identification not found",
      suggestion: "Verify that SSN, name, and tax year are visible",
    });
  }

  if (
    !text.match(/FORM \d{4}/) &&
    !fuzzyContains(text, "1040", 2) &&
    !fuzzyContains(text, "1099", 2) &&
    !fuzzyContains(text, "W-2", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Form type not clearly identified",
      suggestion: "Verify that the transcript shows which tax form it relates to",
    });
  }

  if (
    !fuzzyContains(text, "TOTAL INCOME", 2) &&
    !fuzzyContains(text, "ADJUSTED GROSS", 2) &&
    !fuzzyContains(text, "TAX", 2) &&
    !fuzzyContains(text, "LIABILITY", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Income information not found",
      suggestion: "Verify that income figures are clearly shown",
    });
  }

  if (
    !fuzzyContains(text, "DATE ISSUED", 2) &&
    !fuzzyContains(text, "ISSUE DATE", 2) &&
    !fuzzyContains(text, "REQUESTED ON", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Issue date not found",
      suggestion: "Verify that the transcript issue date is visible",
    });
  }

  // Check if transcript is recent (within last year)
  const issueMatch = text.match(
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})|(\d{4}[\/\-]\d{2}[\/\-]\d{2})|(\d{2}[\/\-]\d{2}[\/\-]\d{2})/
  );
  if (issueMatch) {
    const issueDateStr = issueMatch[0];
    const issueDate = new Date(issueDateStr.replace(/[\/\-]/g, "/"));

    // Tax transcripts are typically valid for 1 year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (issueDate < oneYearAgo) {
      issues.push({
        severity: "warning",
        message: "Tax transcript may be outdated (older than 1 year)",
        suggestion: "Consider requesting a newer transcript if yours is older than 1 year",
      });
    }
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// Form 1040 validation
const validateForm1040 = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (
    !fuzzyContains(text, "1040", 2) &&
    !fuzzyContains(text, "INDIVIDUAL", 2) &&
    !fuzzyContains(text, "INCOME TAX", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Form 1040 designation not found",
      suggestion: "Verify this is Form 1040 U.S. Individual Income Tax Return",
    });
  }

  if (
    !fuzzyContains(text, "SSN", 2) &&
    !fuzzyContains(text, "SOCIAL SECURITY NUMBER", 2) &&
    !fuzzyContains(text, "TAX YEAR", 2) &&
    !fuzzyContains(text, "YEAR", 2) &&
    !fuzzyContains(text, "FORM 1040", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Taxpayer identification not found",
      suggestion: "Verify that SSN, name, and tax year are visible",
    });
  }

  if (
    !fuzzyContains(text, "TOTAL INCOME", 2) &&
    !fuzzyContains(text, "ADJUSTED GROSS", 2) &&
    !fuzzyContains(text, "TAX", 2) &&
    !fuzzyContains(text, "LIABILITY", 2) &&
    !fuzzyContains(text, "REFUND", 2) &&
    !fuzzyContains(text, "OWING", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Income information not found",
      suggestion: "Verify that income figures are clearly shown",
    });
  }

  if (
    !fuzzyContains(text, "SIGNATURE", 2) &&
    !fuzzyContains(text, "SIGNED", 2) &&
    !fuzzyContains(text, "ELECTRONICALLY FILED", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Signature not found",
      suggestion:
        "Verify that the taxpayer's signature is present (or electronic filing confirmation)",
    });
  }

  if (
    !fuzzyContains(text, "DATE", 2) &&
    !fuzzyContains(text, "SIGNED ON", 2) &&
    !fuzzyContains(text, "FILED ON", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "Filing date not found",
      suggestion: "Verify that the filing date is visible",
    });
  }

  // Check if form is complete (not just first page)
  if (text.length < 500) {
    issues.push({
      severity: "warning",
      message: "Form may be incomplete (appears to be only first page)",
      suggestion: "Verify that all pages of Form 1040 are included",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// W-2 Form validation
const validateW2 = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (!fuzzyContains(text, "W-2", 2) && !fuzzyContains(text, "WAGE AND TAX STATEMENT", 2)) {
    issues.push({
      severity: "critical",
      message: "Form W-2 designation not found",
      suggestion: "Verify this is Form W-2 Wage and Tax Statement",
    });
  }

  if (
    !fuzzyContains(text, "EMPLOYEE", 2) &&
    !fuzzyContains(text, "SSN", 2) &&
    !fuzzyContains(text, "SOCIAL SECURITY NUMBER", 2) &&
    !fuzzyContains(text, "EMPLOYER", 2) &&
    !fuzzyContains(text, "EIN", 2) &&
    !fuzzyContains(text, "EMPLOYER ID", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Employee/Employer identification not found",
      suggestion: "Verify that employee SSN and employer EIN are visible",
    });
  }

  if (
    !fuzzyContains(text, "WAGES", 2) &&
    !fuzzyContains(text, "TIPS", 2) &&
    !fuzzyContains(text, "OTHER COMPENSATION", 2) &&
    !fuzzyContains(text, "INCOME", 2) &&
    !fuzzyContains(text, "SALARY", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Income information not found",
      suggestion: "Verify that wages/income figures are clearly shown",
    });
  }

  if (
    !fuzzyContains(text, "BOX 1", 2) &&
    !fuzzyContains(text, "BOX 2", 2) &&
    !fuzzyContains(text, "BOX 16", 2) &&
    !fuzzyContains(text, "BOX 17", 2) &&
    !fuzzyContains(text, "FEDERAL", 2) &&
    !fuzzyContains(text, "STATE", 2)
  ) {
    issues.push({
      severity: "warning",
      message: "W-2 boxes not clearly identified",
      suggestion: "Verify that important boxes (1, 2, 16, 17) are visible",
    });
  }

  if (
    !fuzzyContains(text, "YEAR", 2) &&
    !fuzzyContains(text, "TAX YEAR", 2) &&
    !text.match(/\d{4}/)
  ) {
    issues.push({
      severity: "critical",
      message: "Tax year not found",
      suggestion: "Verify that the tax year is clearly shown",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};

// 1099 Form validation
const validate1099 = (text: string): DocumentValidationResult => {
  const issues: ValidationIssue[] = [];

  if (!fuzzyContains(text, "1099", 2) && !fuzzyContains(text, "FORM 1099", 2)) {
    issues.push({
      severity: "critical",
      message: "Form 1099 designation not found",
      suggestion: "Verify this is a Form 1099 (MISC, NEC, INT, etc.)",
    });
  }

  if (
    !fuzzyContains(text, "PAYER", 2) &&
    !fuzzyContains(text, "RECIPIENT", 2) &&
    !fuzzyContains(text, "TIN", 2) &&
    !fuzzyContains(text, "SSN", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Payer/Recipient identification not found",
      suggestion: "Verify that payer and recipient details are visible",
    });
  }

  if (
    !fuzzyContains(text, "INCOME", 2) &&
    !fuzzyContains(text, "COMPENSATION", 2) &&
    !fuzzyContains(text, "INTEREST", 2) &&
    !fuzzyContains(text, "DIVIDENDS", 2) &&
    !fuzzyContains(text, "PAYMENT", 2)
  ) {
    issues.push({
      severity: "critical",
      message: "Income/Payment information not found",
      suggestion: "Verify that payment amounts are clearly shown",
    });
  }

  if (
    !fuzzyContains(text, "YEAR", 2) &&
    !fuzzyContains(text, "TAX YEAR", 2) &&
    !text.match(/\d{4}/)
  ) {
    issues.push({
      severity: "critical",
      message: "Tax year not found",
      suggestion: "Verify that the tax year is clearly shown",
    });
  }

  // Calculate score based on issues
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "critical") score -= 25;
    if (issue.severity === "warning") score -= 10;
    if (issue.severity === "info") score -= 5;
  });
  score = Math.max(0, score);

  return {
    isValid: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    score,
  };
};
