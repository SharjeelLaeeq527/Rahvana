/**
 * index.ts — public API for the errors module
 *
 * This is the only file call sites should import from.
 *
 * USAGE:
 *
 *   import { msg, E } from '@/lib/errors'
 *
 *   // Simple message
 *   toast.error(msg(E.AUTH_LOGIN_FAILED))
 *
 *   // Message with a safe variable (user-facing values only — never raw error objects)
 *   toast.error(msg(E.UPLOAD_FILE_TOO_LARGE, { maxSize: 100 }))
 *
 *   // Inline validation (replaces alert() calls)
 *   setFieldError('nvcNumber', msg(E.JOURNEY_NVC_CASE_FORMAT))
 *
 * NEVER DO THIS:
 *   toast.error(`Something failed: ${error.message}`)   // leaks internal details
 *   toast.error('Upload failed')                        // hardcoded string, not translatable
 */

import { en } from "./messages.en";
import type { ErrorId } from "./errorIds";
import { E } from "./errorIds";

export { E } from "./errorIds";
export type { ErrorId };

/**
 * Returns the user-facing error string for a given error ID.
 *
 * Optionally accepts a vars map for messages that contain {placeholders}.
 * Only pass sanitised, user-safe values — never raw Error objects, stack
 * traces, internal field names, or SDK error messages.
 *
 * Falls back to a generic safe message if the ID is somehow missing.
 */
export function msg(id: ErrorId, vars?: Record<string, string | number>): string {
  // Ensure the id is treated as a number for the lookup,
  // as numeric literal keys in JS objects can be strict.
  const numericId = Number(id);
  const template: string =
    en[numericId as ErrorId] ?? en[id] ?? `Something went wrong. (Error: ${id})`;

  console.log(`[Error System] Lookup ID: ${id}, Resolved Template: ${!!en[numericId as ErrorId]}`);

  if (!vars) return template;

  // Safe named interpolation — replaces {placeholder} with the provided value.
  // If a placeholder has no matching var, it's left as-is rather than throwing.
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

/**
 * Returns the numeric error ID as a string, useful for logging or
 * displaying to users so they can quote it to support.
 *
 * Example: errorCode(E.AUTH_LOGIN_FAILED) → "ERR-1003"
 */
export function errorCode(id: ErrorId): string {
  return `ERR-${id}`;
}

/**
 * Normalize thrown errors into a safe, client-friendly shape.
 *
 * - Returns a safe `message` (from the messages catalog) and an optional
 *   `code` (the numeric `E` id) when a known condition is detected.
 * - Keeps raw error details out of client responses; callers should still
 *   `console.error` the original error on the server if desired.
 *
 * Call sites may pass a `fallbackId` to specify which user-facing error
 * to use when no known pattern matches the thrown error.
 */
export function normalizeError(
  err: unknown,
  fallbackId?: ErrorId
): { code?: ErrorId; message: string } {
  if (!(err instanceof Error)) {
    return { message: fallbackId ? msg(fallbackId) : msg(E.AUTH_UNEXPECTED_ERROR) };
  }

  const m = err.message || "";

  // Common explicit matches used across the codebase
  if (m === "Unauthorized") return { code: E.AUTH_UNAUTHORIZED, message: msg(E.AUTH_UNAUTHORIZED) };
  if (m.includes("Chapter not found"))
    return { code: E.CHAPTER_NOT_FOUND, message: msg(E.CHAPTER_NOT_FOUND) };
  if (m.includes("Journey not found"))
    return { code: E.JOURNEY_NOT_FOUND, message: msg(E.JOURNEY_NOT_FOUND) };
  if (m.includes("not found"))
    return { code: E.CASE_DATA_NOT_FOUND, message: msg(E.CASE_DATA_NOT_FOUND) };
  if (m.includes("already completed"))
    return { code: E.DASH_JOURNEY_STEP_LOCKED, message: msg(E.DASH_JOURNEY_STEP_LOCKED) };
  if (m.includes("Cannot complete step"))
    return { code: E.CASE_DATA_VALIDATION_FAILED, message: msg(E.CASE_DATA_VALIDATION_FAILED) };
  if (m.includes("Validation failed"))
    return { code: E.CASE_DATA_VALIDATION_FAILED, message: msg(E.CASE_DATA_VALIDATION_FAILED) };
  if (m.includes("does not exist"))
    return { code: E.CASE_DATA_NOT_FOUND, message: msg(E.CASE_DATA_NOT_FOUND) };

  // Internal / implementation-specific matches - do not expose raw text
  if (m.includes("compressed"))
    return { message: fallbackId ? msg(fallbackId) : msg(E.AUTH_UNEXPECTED_ERROR) };
  if (m.includes("function exec_sql"))
    return { message: fallbackId ? msg(fallbackId) : msg(E.AUTH_UNEXPECTED_ERROR) };

  // Fallback
  return { message: fallbackId ? msg(fallbackId) : msg(E.AUTH_UNEXPECTED_ERROR) };
}

/**
 * Safe helper to test whether an Error's message contains the given
 * substring. This centralises the single responsibility of matching error
 * text so other files don't call `.message.includes(...)` directly.
 */
export function errorContains(err: unknown, substr: string): boolean {
  if (!(err instanceof Error)) return false;
  return err.message.includes(substr);
}
