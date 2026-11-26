/**
 * Routes that have been converted to colour tokens and may render in dark mode.
 * Every other route is forced to light, whatever the user picked, so nobody lands
 * on a half-converted screen. Add a prefix only after that whole route is done
 * (docs/dark-mode-implementation-plan.md).
 *
 * A prefix matches the route itself and everything under it: "/login" matches
 * "/login" and "/login/x", not "/login-help". Use "/" alone for the home page only.
 */
export const DARK_READY_PREFIXES: readonly string[] = [];

/** Routes that stay light forever (internal tools, paper-like pages). */
export const NEVER_DARK_PREFIXES: readonly string[] = ["/admin"];

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isDarkReadyRoute(
  pathname: string | null | undefined,
  readyPrefixes: readonly string[] = DARK_READY_PREFIXES,
): boolean {
  if (!pathname) return false;
  if (NEVER_DARK_PREFIXES.some((p) => matchesPrefix(pathname, p))) return false;
  return readyPrefixes.some((p) => matchesPrefix(pathname, p));
}
