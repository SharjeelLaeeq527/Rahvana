/**
 * Format and quality validators for Chapter 1 case-strength checks.
 *
 * All functions are pure: same input always returns same output, no side
 * effects, no I/O. Safe to import anywhere.
 */

import type { FileQualityCheckResult, ReceiptFormatValidation } from "./types";

const USCIS_SERVICE_CENTER_CODES: Record<string, string> = {
  EAC: "Vermont Service Center",
  WAC: "California Service Center",
  LIN: "Nebraska Service Center",
  SRC: "Texas Service Center",
  MSC: "National Benefits Center (Missouri)",
  NBC: "National Benefits Center",
  IOE: "USCIS ELIS / online filing system",
};

const RECEIPT_NUMBER_PATTERN = /^[A-Z]{3}\d{10}$/;

/**
 * Validates a USCIS receipt number against the published I-797C format:
 * 3-letter service center code followed by 10 digits.
 *
 * Source: USCIS published I-797C examples on uscis.gov
 */
export function validateReceiptNumber(input: string): ReceiptFormatValidation {
  const trimmed = (input ?? "").trim().toUpperCase();

  if (!trimmed) {
    return {
      valid: false,
      message: "Receipt number is empty.",
    };
  }

  if (!RECEIPT_NUMBER_PATTERN.test(trimmed)) {
    return {
      valid: false,
      message:
        "This does not match the standard USCIS receipt number format. " +
        "I-797C receipt numbers are 3 letters followed by 10 digits (e.g., MSC2390123456). " +
        "Double-check the number printed on your notice.",
    };
  }

  const code = trimmed.slice(0, 3);
  const serviceCenter = USCIS_SERVICE_CENTER_CODES[code];

  if (!serviceCenter) {
    return {
      valid: true,
      service_center_code: code,
      message:
        `Format is valid, but the prefix "${code}" is not in the list of common ` +
        "USCIS service center codes. Verify the receipt number against your I-797C notice.",
    };
  }

  return {
    valid: true,
    service_center_code: code,
    service_center: serviceCenter,
  };
}

/**
 * USCIS online portal file requirements as published at myaccount.uscis.gov.
 */
export const USCIS_PORTAL_FILE_LIMITS = {
  max_file_size_mb: 12,
  accepted_extensions: ["pdf", "jpg", "jpeg", "tif", "tiff"] as const,
};

/**
 * Checks whether a file meets the USCIS online portal upload requirements.
 * Pure function — no actual file I/O. Caller supplies file metadata.
 */
export function checkFileQuality(input: {
  name: string;
  size_bytes: number;
}): FileQualityCheckResult {
  const issues: string[] = [];

  if (!input.name) {
    return { passes: false, issues: ["File has no name."] };
  }

  const lastDot = input.name.lastIndexOf(".");
  const extension = lastDot >= 0 ? input.name.slice(lastDot + 1).toLowerCase() : "";

  if (
    !extension ||
    !(USCIS_PORTAL_FILE_LIMITS.accepted_extensions as readonly string[]).includes(extension)
  ) {
    issues.push(
      `File format ".${extension || "(none)"}" is not accepted by the USCIS ` +
        `online portal. Accepted formats: ${USCIS_PORTAL_FILE_LIMITS.accepted_extensions
          .map((e) => "." + e)
          .join(", ")}.`
    );
  }

  const sizeMb = input.size_bytes / (1024 * 1024);
  if (sizeMb > USCIS_PORTAL_FILE_LIMITS.max_file_size_mb) {
    issues.push(
      `File is ${sizeMb.toFixed(1)} MB. The USCIS online portal limit is ` +
        `${USCIS_PORTAL_FILE_LIMITS.max_file_size_mb} MB per file.`
    );
  }

  return { passes: issues.length === 0, issues };
}
