// File Naming and Storage Utilities

import path from "path";
import { DocumentRole } from "./types";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * Normalizes a name for use in filenames
 * - Removes special characters
 * - Replaces spaces with underscores
 * - Converts to ASCII-safe characters
 * - Limits length
 */
export function normalizeName(name: string, maxLength: number = 30): string {
  return name
    .normalize("NFD") // Decompose unicode characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special chars
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .substring(0, maxLength)
    .toUpperCase();
}

/**
 * Generates standardized filename according to naming convention:
 * {CASE_ID}_{ROLE}_{PERSON_NAME}_{DOC_KEY}_{YYYY-MM-DD}_{VERSION}.{ext}
 */
export interface FileNamingOptions {
  caseId?: string;
  role: DocumentRole;
  personName: string;
  docKey: string;
  date?: Date;
  version?: number;
  originalExtension: string;
}

export function generateStandardizedFilename(
  options: FileNamingOptions,
): string {
  const {
    caseId = "CASE",
    role,
    personName,
    docKey,
    date = new Date(),
    version = 1,
    originalExtension,
  } = options;

  // Normalize components
  const normalizedCaseId = caseId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const normalizedRole = role.toUpperCase();
  const normalizedName = normalizeName(personName);
  const normalizedDocKey = docKey.toUpperCase();

  // Format date as YYYY-MM-DD
  const dateStr = date.toISOString().split("T")[0];

  // Format version as v1, v2, etc.
  const versionStr = `v${version}`;

  // Clean extension (remove dot if present)
  const ext = originalExtension.replace(/^\./, "").toLowerCase();

  // Construct filename
  const filename = [
    normalizedCaseId,
    normalizedRole,
    normalizedName,
    normalizedDocKey,
    dateStr,
    versionStr,
  ]
    .filter(Boolean)
    .join("_");

  // Ensure total length doesn't exceed 120 chars
  const maxNameLength = 120 - ext.length - 1; // -1 for the dot
  const truncatedFilename =
    filename.length > maxNameLength
      ? filename.substring(0, maxNameLength)
      : filename;

  return `${truncatedFilename}.${ext}`;
}

/**
 * Ensures filename uniqueness by appending _01, _02, etc.
 */
export function ensureUniqueFilename(
  filename: string,
  existingFilenames: string[],
): string {
  if (!existingFilenames.includes(filename)) {
    return filename;
  }

  const ext = path.extname(filename);
  const nameWithoutExt = filename.substring(0, filename.length - ext.length);

  let counter = 1;
  let uniqueFilename = `${nameWithoutExt}_${counter
    .toString()
    .padStart(2, "0")}${ext}`;

  while (existingFilenames.includes(uniqueFilename)) {
    counter++;
    uniqueFilename = `${nameWithoutExt}_${counter
      .toString()
      .padStart(2, "0")}${ext}`;
  }

  return uniqueFilename;
}

/**
 * Gets file extension from filename or mime type
 */
export function getFileExtension(filename: string, mimeType?: string): string {
  // First try from filename
  const lastDot = filename.lastIndexOf(".");
  if (lastDot !== -1 && lastDot < filename.length - 1) {
    return filename.substring(lastDot + 1).toLowerCase();
  }

  // Fall back to mime type
  if (mimeType) {
    const mimeToExt: Record<string, string> = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
    };

    return mimeToExt[mimeType] || "bin";
  }

  return "bin";
}

/**
 * Validates file type
 */
export function isValidFileType(
  filename: string,
  mimeType: string,
  t?: TranslateFn,
): { valid: boolean; message?: string } {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      message: t
        ? t("documentVaultPage.uploadModal.fileTypeError")
        : "File type not allowed. Allowed types: PDF, JPG, PNG, GIF, DOC, DOCX",
    };
  }

  return { valid: true };
}

/**
 * Validates file size (in bytes)
 */
export function isValidFileSize(
  fileSize: number,
  maxSizeMB: number = 10,
  t?: TranslateFn,
): { valid: boolean; message?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (fileSize > maxSizeBytes) {
    return {
      valid: false,
      message: t
        ? t("documentVaultPage.uploadModal.fileSizeError")
        : `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  if (fileSize === 0) {
    return {
      valid: false,
      message: t
        ? t("documentVaultPage.uploadModal.fileEmptyError") || "File is empty"
        : "File is empty",
    };
  }

  return { valid: true };
}

/**
 * Gets relative storage path (for database storage)
 * Note: Use forward slashes for cross-platform compatibility
 */
export function getRelativeStoragePath(
  userId: string,
  documentId: string,
  filename: string,
): string {
  return `document-vault/${userId}/${documentId}/${filename}`;
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number, t?: TranslateFn): string {
  if (bytes === 0)
    return t
      ? `0 ${t("documentVaultPage.logic.fileSize.bytes") || "Bytes"}`
      : "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const unit = sizes[i];
  // t
  //     ? t(`documentVaultPage.logic.fileSize.${sizes[i].toLowerCase()}`)
  //     :
  return (
    Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + (unit || sizes[i])
  );
}

/**
 * Parses standardized filename back to components
 */
export function parseStandardizedFilename(filename: string): {
  caseId?: string;
  role?: string;
  personName?: string;
  docKey?: string;
  date?: string;
  version?: string;
  extension?: string;
} | null {
  try {
    const lastDot = filename.lastIndexOf(".");
    const ext = lastDot !== -1 ? filename.substring(lastDot) : "";
    const nameWithoutExt =
      lastDot !== -1 ? filename.substring(0, lastDot) : filename;
    const parts = nameWithoutExt.split("_");

    if (parts.length < 5) {
      return null; // Not a standardized filename
    }

    return {
      caseId: parts[0],
      role: parts[1],
      personName: parts[2],
      docKey: parts[3],
      date: parts[4],
      version: parts[5],
      extension: ext.substring(1),
    };
  } catch {
    return null;
  }
}

/**
 * Sanitizes filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace unsafe chars with underscore
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .substring(0, 255); // Limit length
}

/**
 * Gets category folder name for export
 */
export function getCategoryFolderName(category: string): string {
  const folderNames: Record<string, string> = {
    CIVIL: "01_Civil_Documents",
    FINANCIAL: "02_Financial_Sponsor",
    RELATIONSHIP: "03_Relationship_Evidence",
    POLICE: "04_Police_Court_Military",
    MEDICAL: "05_Medical_Documents",
    PHOTOS: "06_Photographs",
    TRANSLATIONS: "07_Translations_Certifications",
    MISC: "08_Miscellaneous_Case_Evidence",
  };

  return folderNames[category] || category;
}

/**
 * Converts standardized filename to human-readable display name
 * Example: CASE_PETITIONER_JOHNDOE_PASSPORT_2024-12-24_v1.pdf
 * Becomes: Passport - John Doe (Petitioner) - Dec 24, 2024
 */
export function getHumanReadableFileName(
  standardizedFilename: string,
  t?: TranslateFn,
): string {
  const parsed = parseStandardizedFilename(standardizedFilename);

  if (!parsed || !parsed.docKey || !parsed.personName) {
    // Fallback to original filename if parsing fails
    return standardizedFilename;
  }

  // Convert doc key to title case
  const docName = parsed.docKey
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

  // Convert person name to title case with spaces
  const personName = parsed.personName
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

  // Convert role to readable format
  const role = parsed.role
    ? t &&
      t(`documentVaultPage.roles.${parsed.role}`) !==
        `documentVaultPage.roles.${parsed.role}`
      ? t(`documentVaultPage.roles.${parsed.role}`)
      : parsed.role
          .split("_")
          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
          .join(" ")
    : "";

  // Format date to readable format
  let dateStr = "";
  if (parsed.date) {
    try {
      const date = new Date(parsed.date);
      dateStr = date.toLocaleDateString(
        t ? t("@@locale") || "en-US" : "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      );
    } catch {
      dateStr = parsed.date;
    }
  }

  // Build display name
  const parts = [docName, personName, role ? `(${role})` : "", dateStr].filter(
    Boolean,
  );

  return parts.join(" - ");
}

/**
 * Gets short display name for file (without full details)
 * Example: Passport - John Doe
 */
export function getShortDisplayName(
  standardizedFilename: string,
  docName?: string,
  t?: TranslateFn,
): string {
  const parsed = parseStandardizedFilename(standardizedFilename);

  if (!parsed || !parsed.personName) {
    // Use provided docName or fallback to filename
    return docName || standardizedFilename;
  }

  // Convert person name to title case
  const personName = parsed.personName
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

  // Use provided docName or parse from key
  const displayDocName =
    docName ||
    (parsed.docKey
      ? t &&
        t(`documentVaultPage.documents.${parsed.docKey.toLowerCase()}.name`) !==
          `documentVaultPage.documents.${parsed.docKey.toLowerCase()}.name`
        ? t(`documentVaultPage.documents.${parsed.docKey.toLowerCase()}.name`)
        : parsed.docKey
            .split("_")
            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(" ")
      : "");

  return `${displayDocName} - ${personName}`;
}
