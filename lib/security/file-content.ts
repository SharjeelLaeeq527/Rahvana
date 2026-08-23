import { fileTypeFromBuffer } from "file-type";
import type { UploadProfile } from "@/lib/security/upload-limits";

export type FileContentValidationResult =
  | { ok: true; buffer: Buffer; detectedMime: string }
  | { ok: false; status: 415 | 400; error: string };

function isLegacyDocAllowed(
  profile: UploadProfile,
  filename: string,
  detectedMime: string | undefined
): boolean {
  if (!profile.allowLegacyDoc) return false;
  const lower = filename.toLowerCase();
  return lower.endsWith(".doc") && detectedMime === "application/x-cfb";
}

/**
 * Validate untrusted upload content using magic bytes.
 * Reads the file once and returns the buffer for downstream storage/OCR.
 */
export async function validateUploadedFile(
  file: File,
  profile: UploadProfile
): Promise<FileContentValidationResult> {
  if (!file || file.size === 0) {
    return { ok: false, status: 400, error: "File is empty" };
  }

  if (file.size > profile.maxBytes) {
    const maxMb = Math.floor(profile.maxBytes / (1024 * 1024));
    return { ok: false, status: 400, error: `File size exceeds ${maxMb}MB limit` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const detectedMime = detected?.mime;

  if (!detectedMime) {
    return {
      ok: false,
      status: 415,
      error: "Unsupported or unrecognized file content",
    };
  }

  const allowed = profile.allowedMimeTypes.includes(detectedMime);
  const legacyDoc = isLegacyDocAllowed(profile, file.name, detectedMime);

  if (!allowed && !legacyDoc) {
    return {
      ok: false,
      status: 415,
      error: "File content type is not allowed",
    };
  }

  return { ok: true, buffer, detectedMime };
}

/** For routes that accept multiple files (feedback attachments). */
export async function validateUploadedFiles(
  files: File[],
  profile: UploadProfile
): Promise<FileContentValidationResult & { buffers?: Buffer[] }> {
  const buffers: Buffer[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const result = await validateUploadedFile(file, profile);
    if (!result.ok) return result;
    buffers.push(result.buffer);
  }
  return { ok: true, buffer: buffers[0] ?? Buffer.alloc(0), detectedMime: "multipart", buffers };
}
