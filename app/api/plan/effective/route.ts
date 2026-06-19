import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/case-collaboration/helpers";
import { resolveEffectivePlan } from "@/lib/case-collaboration/entitlements";

/**
 * GET /api/plan/effective
 *
 * Returns the plan that applies to the authenticated user RIGHT NOW, accounting
 * for shared-case membership (spec §6):
 *   - An invited partner inherits the case OWNER's tier + purchased add-ons.
 *   - Everyone else gets their own plan.
 *
 * Resolution is LIVE — read on every call, never snapshotted — so a partner
 * tracks the owner's current plan (downgrade/lapse propagates immediately).
 *
 * Why service-role: a partner cannot read the owner's `user_profiles` row via
 * RLS, so the inheritance lookup must run with the admin client server-side.
 * After verifying the *caller's* identity, we only ever read plan fields.
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    const plan = await resolveEffectivePlan(admin, user.id);

    return NextResponse.json(plan);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[plan/effective] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
