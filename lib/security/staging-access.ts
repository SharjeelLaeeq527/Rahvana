/**
 * lib/security/staging-access.ts
 *
 * Enforces email whitelist restrictions on the staging environment.
 * Prevents unauthorized users from signing up, logging in, or holding
 * an active session on the staging platform.
 */

/**
 * Returns whether the staging access restriction should be active.
 * - Always disabled in production (NEXT_PUBLIC_ENVIRONMENT === "production").
 * - Active when NEXT_PUBLIC_ENVIRONMENT === "development".
 * - Can also be forced in development via STAGING_RESTRICT_ACCESS=true for local testing.
 */
export function isStagingRestrictionActive(): boolean {
  const env = (process.env.NEXT_PUBLIC_ENVIRONMENT || "").toLowerCase().trim();

  // Never restrict in production
  if (env === "production") {
    return false;
  }

  // Active in staging
  if (env === "staging" || env === "development") {
    return true;
  }

  // Allow explicit activation in dev/test via environment variable
  if (process.env.STAGING_RESTRICT_ACCESS === "true") {
    return true;
  }

  return false;
}

/**
 * Validates whether an email address is allowed on the staging platform.
 *
 * Hierarchy:
 * 1. If staging restrictions are not active, returns true.
 * 2. If the email is missing or empty, returns false.
 * 3. Admins configured in ADMIN_EMAILS are automatically allowed.
 * 4. Checks against STAGING_ALLOWED_EMAILS (supports exact emails & @domain.com wildcards).
 */
export function isStagingEmailAllowed(email?: string | null): boolean {
  if (!isStagingRestrictionActive()) {
    return true;
  }

  if (!email || typeof email !== "string") {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  // 1. Auto-allow ADMIN_EMAILS so administrators are never locked out
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.includes(normalizedEmail)) {
    return true;
  }

  // 2. Check against STAGING_ALLOWED_EMAILS
  const allowedListRaw = process.env.STAGING_ALLOWED_EMAILS || "";
  const allowedPatterns = allowedListRaw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedPatterns.length === 0) {
    return false;
  }

  return allowedPatterns.some((pattern) => {
    if (pattern.startsWith("@")) {
      return normalizedEmail.endsWith(pattern);
    }
    if (pattern.startsWith("*@")) {
      return normalizedEmail.endsWith(pattern.slice(1));
    }
    return normalizedEmail === pattern;
  });
}

/**
 * Returns the list of emails authorized to manage staging TOTP access keys
 * (Owner & Managers only).
 *
 * Configured strictly in STAGING_TOTP_MANAGER_EMAILS.
 * If not configured, returns an empty array (fail-safe: no one gets access unless explicitly configured).
 */
export function getStagingTotpManagerEmails(): string[] {
  return (
    process.env.STAGING_TOTP_MANAGER_EMAILS ||
    ""
  )
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isStagingTotpManager(email?: string | null): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const managers = getStagingTotpManagerEmails();
  return managers.includes(normalizedEmail);
}
