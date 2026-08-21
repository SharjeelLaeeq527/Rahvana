/**
 * Central upload size + allowed MIME profiles for API routes.
 * Tune limits here — do not scatter magic numbers across routes.
 */

export const BYTES = {
  MB: 1024 * 1024,
} as const;

/** Hard ceiling for any API request body (must be ≥ largest per-route limit). */
export const GLOBAL_API_BODY_LIMIT_BYTES = 55 * BYTES.MB;

export type UploadProfileName =
  | "vault"
  | "guide"
  | "consultation"
  | "appointment"
  | "policeVerification"
  | "translation"
  | "feedbackAttachment"
  | "ocrReceipt"
  | "ocrExtract"
  | "convertPdfDefault"
  | "convertPdfImage";

export type UploadProfile = {
  maxBytes: number;
  /** MIME types allowed after magic-byte detection */
  allowedMimeTypes: readonly string[];
  /** Optional: also accept legacy .doc (often detected as application/x-cfb) */
  allowLegacyDoc?: boolean;
};

const VAULT_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const IMAGE_PDF_MIMES = ["application/pdf", "image/jpeg", "image/png"] as const;

const FEEDBACK_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const UPLOAD_PROFILES: Record<UploadProfileName, UploadProfile> = {
  vault: {
    maxBytes: 10 * BYTES.MB,
    allowedMimeTypes: VAULT_MIMES,
    allowLegacyDoc: true,
  },
  guide: {
    maxBytes: 10 * BYTES.MB,
    allowedMimeTypes: VAULT_MIMES,
    allowLegacyDoc: true,
  },
  consultation: {
    maxBytes: 10 * BYTES.MB,
    allowedMimeTypes: VAULT_MIMES,
    allowLegacyDoc: true,
  },
  appointment: {
    maxBytes: 20 * BYTES.MB,
    allowedMimeTypes: IMAGE_PDF_MIMES,
  },
  policeVerification: {
    maxBytes: 20 * BYTES.MB,
    allowedMimeTypes: IMAGE_PDF_MIMES,
  },
  translation: {
    maxBytes: 50 * BYTES.MB,
    allowedMimeTypes: ["application/pdf"],
  },
  feedbackAttachment: {
    maxBytes: 5 * BYTES.MB,
    allowedMimeTypes: FEEDBACK_MIMES,
  },
  ocrReceipt: {
    maxBytes: 1 * BYTES.MB,
    allowedMimeTypes: IMAGE_PDF_MIMES,
  },
  ocrExtract: {
    maxBytes: 10 * BYTES.MB,
    allowedMimeTypes: IMAGE_PDF_MIMES,
  },
  convertPdfDefault: {
    maxBytes: 10 * BYTES.MB,
    allowedMimeTypes: [
      "text/plain",
      "text/html",
      "text/markdown",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    allowLegacyDoc: true,
  },
  convertPdfImage: {
    maxBytes: 50 * BYTES.MB,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
};