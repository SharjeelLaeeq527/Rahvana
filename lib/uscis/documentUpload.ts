/**
 * USCIS Developer Portal — encoded file upload support.
 *
 * The portal's document endpoints take a JSON body (NOT multipart form data)
 * with the file Base64-encoded inside it:
 *
 *   { "document": { "fileName": "...", "fileType": "application/pdf", "fileContent": "<base64>" } }
 *
 * This module builds that payload and strictly enforces the portal's
 * attachment criteria so uploads fail fast on our side instead of at USCIS:
 *  - Supported formats: standard PDFs and images only.
 *  - File naming: English letters, numbers, spaces, periods, hyphens,
 *    underscores, and parentheses only.
 *  - No password-protected / encrypted files (real /Encrypt trailer check
 *    for PDFs, plus magic-byte verification for all types).
 */

export interface UscisDocumentInput {
  fileName: string;
  fileType: string;
  /** Pure Base64 string (no data-URL prefix). */
  fileContent: string;
}

export interface UscisDocumentPayload {
  document: {
    fileName: string;
    fileType: string;
    fileContent: string;
  };
}

/** Portal-side guidance caps attachments well under this; keep in sync if they change. */
export const USCIS_MAX_DOC_BYTES = 15 * 1024 * 1024;

/** Allowed MIME types mapped to their accepted file extensions. */
const ALLOWED_DOC_TYPES: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/pdf": ["pdf"], // some browsers mislabel PDFs — normalized below
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/jpg": ["jpg", "jpeg"],
};

/**
 * Portal filename rule: English letters, numbers, spaces, periods, hyphens,
 * underscores, parentheses. Anything else (emojis, #, &, non-ASCII, …) 400s.
 */
export const USCIS_FILENAME_PATTERN = /^[A-Za-z0-9 .()_-]+$/;

export class UscisDocumentError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "UscisDocumentError";
    this.status = status;
  }
}

/** Detect a genuine (unencrypted) PDF header. */
function hasPdfMagic(bytes: Uint8Array): boolean {
  return (
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 // F
  );
}

function hasPngMagic(bytes: Uint8Array): boolean {
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

function hasJpegMagic(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/**
 * Heuristic but reliable: an encrypted PDF always carries an /Encrypt
 * reference in its cross-reference trailer (end of file). Scanning the last
 * 32 KB avoids false positives from the /Encrypt keyword appearing in
 * page text, and needs no PDF parser dependency.
 */
export function isEncryptedPdf(bytes: Uint8Array): boolean {
  const tailStart = Math.max(0, bytes.length - 32 * 1024);
  const tail = Buffer.from(bytes.subarray(tailStart)).toString("latin1");
  return /\/Encrypt[\s/<]/.test(tail) || /\/Stm\/Crypt|\/Filter\s*\/Standard/.test(tail);
}

/** Normalize browser MIME quirks to the canonical type we send upstream. */
function normalizeFileType(declared: string, extension: string): string {
  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  return declared;
}

/**
 * Validate the client-supplied file against the portal criteria and build the
 * exact JSON payload the USCIS document endpoints expect.
 * Throws UscisDocumentError (400) on any violation.
 */
export function buildUscisDocumentPayload(input: UscisDocumentInput): UscisDocumentPayload {
  const fileName = (input.fileName ?? "").trim();
  const declaredType = (input.fileType ?? "").toLowerCase().trim();

  if (!fileName) {
    throw new UscisDocumentError("File name is required.");
  }

  // ── Rule: filename character set ─────────────────────────────────────────
  if (!USCIS_FILENAME_PATTERN.test(fileName)) {
    throw new UscisDocumentError(
      'File name can only contain letters, numbers, spaces, periods, hyphens, underscores, and parentheses. Rename "' +
        fileName +
        '" and try again.'
    );
  }

  // ── Rule: supported file types ───────────────────────────────────────────
  const extension = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  const allowedExtensions = ALLOWED_DOC_TYPES[declaredType];
  if (!extension || !allowedExtensions || !allowedExtensions.includes(extension)) {
    throw new UscisDocumentError(
      "Unsupported file type. Attach a standard PDF, PNG, or JPEG image."
    );
  }

  const fileType = normalizeFileType(declaredType, extension);

  // ── Base64 decoding + size limit ─────────────────────────────────────────
  const fileContent = (input.fileContent ?? "").trim();
  if (!fileContent || !/^[A-Za-z0-9+/]+={0,2}$/.test(fileContent.replace(/\s/g, ""))) {
    throw new UscisDocumentError("File content must be a valid Base64 string.");
  }

  const bytes = Buffer.from(fileContent, "base64");
  if (bytes.length === 0) {
    throw new UscisDocumentError("The uploaded file is empty.");
  }
  if (bytes.length > USCIS_MAX_DOC_BYTES) {
    throw new UscisDocumentError(
      `File is too large (${(bytes.length / (1024 * 1024)).toFixed(1)} MB). Maximum size is ${USCIS_MAX_DOC_BYTES / (1024 * 1024)} MB.`
    );
  }

  // ── Magic-byte verification (declared type must match actual content) ────
  const magicOk =
    fileType === "application/pdf"
      ? hasPdfMagic(bytes)
      : fileType === "image/png"
        ? hasPngMagic(bytes)
        : hasJpegMagic(bytes);
  if (!magicOk) {
    throw new UscisDocumentError(
      "The file contents do not match its declared type. Please attach a real PDF, PNG, or JPEG file."
    );
  }

  // ── Rule: no encrypted / password-protected files ────────────────────────
  if (fileType === "application/pdf" && isEncryptedPdf(bytes)) {
    throw new UscisDocumentError(
      "Password-protected or encrypted PDFs cannot be processed. Remove the protection and upload again."
    );
  }

  return {
    document: {
      fileName,
      fileType,
      // Send canonical, whitespace-free Base64.
      fileContent: fileContent.replace(/\s/g, ""),
    },
  };
}
