/**
 * Returns a safe, same-origin relative redirect path.
 *
 * Only paths that start with a single "/" are allowed. This rejects:
 *  - absolute URLs (https://evil.com)
 *  - protocol-relative URLs (//evil.com)
 *  - anything that is not a string
 *
 * This prevents open-redirect attacks where user-controlled input is used to
 * send a freshly authenticated user to an attacker-controlled site.
 */
export function safeRedirectPath(
  input?: string | null,
  fallback: string = "/"
): string {
  if (typeof input === "string" && input.startsWith("/") && !input.startsWith("//")) {
    return input;
  }
  return fallback;
}
