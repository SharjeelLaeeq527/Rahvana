/**
 * Feature flags gated by deploy environment.
 *
 * IR-5 (parent visa) is hidden on production until it is ready to launch.
 * The IR-5 code still ships in every build; only its user-facing entry points
 * are locked behind this flag.
 *
 * IR-5 is visible when EITHER:
 *   - NEXT_PUBLIC_ENABLE_IR5 === "true"        (explicit force-on, e.g. prod launch), OR
 *   - NEXT_PUBLIC_ENVIRONMENT !== "production"  (staging/local show it by default)
 *
 * So staging (NEXT_PUBLIC_ENVIRONMENT=development) shows IR-5 automatically,
 * production (NEXT_PUBLIC_ENVIRONMENT=production) hides it, and the day IR-5
 * launches on production we set NEXT_PUBLIC_ENABLE_IR5=true - no code change.
 *
 * NEXT_PUBLIC_ vars are inlined at build time, so this works in both server
 * and client components.
 */
export const IR5_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_IR5 === "true" ||
  process.env.NEXT_PUBLIC_ENVIRONMENT !== "production";
