/**
 * Feature flags gated by deploy environment.
 *
 * IR-5 (parent visa) is hidden on production until it is ready to launch.
 * The IR-5 code still ships in every build; only its user-facing entry points
 * are locked behind this flag.
 *
 * Resolution order for NEXT_PUBLIC_ENABLE_IR5:
 *   - "true"   -> force ON  (e.g. production launch day)
 *   - "false"  -> force OFF (e.g. test the hidden state on staging WITHOUT
 *                 changing NEXT_PUBLIC_ENVIRONMENT, so the tier toggle and other
 *                 dev-only features stay untouched)
 *   - unset    -> follow the environment: shown everywhere except production
 *
 * So staging (NEXT_PUBLIC_ENVIRONMENT=development) shows IR-5 by default,
 * production (NEXT_PUBLIC_ENVIRONMENT=production) hides it, the day IR-5 launches
 * we set NEXT_PUBLIC_ENABLE_IR5=true on production, and to preview the hidden
 * state on staging we set NEXT_PUBLIC_ENABLE_IR5=false there (then remove it).
 *
 * NEXT_PUBLIC_ vars are inlined at build time, so this works in both server
 * and client components.
 */
export const IR5_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_IR5 === "true" ||
  (process.env.NEXT_PUBLIC_ENABLE_IR5 !== "false" &&
    process.env.NEXT_PUBLIC_ENVIRONMENT !== "production");
