/**
 * S1: a signed-in user must not be able to give themselves a paid journey plan.
 *
 * Vectors closed:
 *  1. Direct PostgREST UPDATE of journeys.subscription_tier / stripe_subscription_id
 *     (own-row UPDATE policy, no column guard) -> trigger guard_journey_billing.
 *  2. A forged candidates[].tier (or a stored journeyTiers map) written through
 *     /api/profile/complete and then copied onto the journey row by initialize ->
 *     the roster and the map are server-owned keys (app + guard_user_profile_billing),
 *     and initialize only takes a tier from a live Stripe plan (journey-initialize.test).
 */

import fs from "fs";
import path from "path";
import { createFakeSupabase, type Row } from "../candidate/fakeSupabase";

const MIGRATION = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/20261113_01_guard_journey_billing_and_roster.sql"),
  "utf8"
);

describe("migration 20261113_01 (SQL)", () => {
  it("guards journeys billing columns for authenticated and anon writes", () => {
    const fn = MIGRATION.slice(
      MIGRATION.indexOf("FUNCTION public.guard_journey_billing"),
      MIGRATION.indexOf("DROP TRIGGER IF EXISTS trg_guard_journey_billing")
    );
    expect(fn).toMatch(/auth\.role\(\), ''\) IN \('authenticated', 'anon'\)/);
    expect(fn).toMatch(/NEW\.subscription_tier := 'free'/);
    expect(fn).toMatch(/NEW\.stripe_subscription_id := NULL/);
    expect(fn).toMatch(/NEW\.subscription_tier := OLD\.subscription_tier/);
    expect(fn).toMatch(/NEW\.stripe_subscription_id := OLD\.stripe_subscription_id/);
    expect(MIGRATION).toMatch(
      /CREATE TRIGGER trg_guard_journey_billing\s+BEFORE INSERT OR UPDATE ON public\.journeys/
    );
  });

  it("makes the roster and the legacy tier map server-owned profile keys", () => {
    for (const key of ["candidates", "candidateIdHighWater", "journeyTiers", "journey_tiers"]) {
      expect(MIGRATION).toContain(`'${key}'`);
    }
  });

  it("does not block service_role (no role other than authenticated / anon is guarded)", () => {
    expect(MIGRATION).not.toMatch(/service_role'\)/);
  });
});

describe("trigger model: what the authenticated role can and cannot change", () => {
  const tables: Record<string, Row[]> = {
    journeys: [{ id: "j1", user_id: "u1", journey_type: "ir2", subscription_tier: "free", stripe_subscription_id: null, current_step_id: null }],
    user_profiles: [
      {
        id: "u1",
        profile_details: { candidates: [{ id: "candidate-1", visaCategory: "IR-2", tier: "free" }] },
      },
    ],
  };
  const asUser = createFakeSupabase(tables, { guard: true });
  const asService = createFakeSupabase(tables);

  it("a direct tier update is reverted, an ordinary update still lands", async () => {
    await asUser.from("journeys").update({ subscription_tier: "executive", current_step_id: "s2" }).eq("id", "j1");
    expect(tables.journeys[0]).toMatchObject({ subscription_tier: "free", current_step_id: "s2" });
  });

  it("an insert cannot start paid", async () => {
    await asUser.from("journeys").insert({ user_id: "u1", journey_type: "ir5", subscription_tier: "premium", stripe_subscription_id: "sub_fake" });
    expect(tables.journeys.find((j) => j.journey_type === "ir5")).toMatchObject({
      subscription_tier: "free",
      stripe_subscription_id: null,
    });
  });

  it("a forged roster tier is reverted; the Stripe paths (service role) still write", async () => {
    await asUser
      .from("user_profiles")
      .update({ profile_details: { candidates: [{ id: "candidate-1", visaCategory: "IR-2", tier: "executive" }], journeyTiers: { ir2: "executive" } } })
      .eq("id", "u1");
    expect(tables.user_profiles[0].profile_details.candidates[0].tier).toBe("free");
    expect(tables.user_profiles[0].profile_details.journeyTiers).toBeUndefined();

    await asService.from("journeys").update({ subscription_tier: "premium", stripe_subscription_id: "sub_real" }).eq("id", "j1");
    expect(tables.journeys[0]).toMatchObject({ subscription_tier: "premium", stripe_subscription_id: "sub_real" });
  });
});

// --- /api/profile/complete: the roster cannot be written through a profile save ---

let profileTables: Record<string, Row[]>;
jest.mock("@/lib/supabase/server", () => ({
  createClient: async () => createFakeSupabase(profileTables, { user: { id: "u1" }, guard: true }),
}));
jest.mock("@supabase/ssr", () => ({ createServerClient: () => createFakeSupabase(profileTables) }));
jest.mock("@/lib/encryption", () => ({ encrypt: (v: string) => v, decrypt: (v: string) => v }));

import { POST as profileComplete } from "@/app/api/profile/complete/route";

describe("/api/profile/complete keeps the stored roster", () => {
  const storedRoster = [
    { id: "candidate-1", visaCategory: "IR-5", tier: "premium", categorySlot: 1 },
    { id: "candidate-2", visaCategory: "IR-5", tier: "free", categorySlot: 2 },
  ];

  beforeEach(() => {
    profileTables = {
      user_profiles: [
        { id: "u1", profile_details: { candidates: storedRoster, candidateIdHighWater: 2, fullName: "Old" } },
      ],
    };
  });

  it("ignores a forged candidate tier, slot and an injected journeyTiers map", async () => {
    const res = await profileComplete(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          profile_details: {
            fullName: "New",
            candidates: [
              { id: "candidate-1", visaCategory: "IR-5", tier: "premium", categorySlot: 1 },
              { id: "candidate-2", visaCategory: "IR-5", tier: "executive", categorySlot: 1 },
              { id: "candidate-9", visaCategory: "IR-2", tier: "executive" },
            ],
            journeyTiers: { ir5_candidate2: "executive" },
            candidateIdHighWater: 0,
          },
        }),
      })
    );
    expect(res.status).toBe(200);
    const saved = profileTables.user_profiles[0].profile_details;
    expect(saved.fullName).toBe("New");
    expect(saved.candidates).toEqual(storedRoster);
    expect(saved.journeyTiers).toBeUndefined();
    expect(saved.candidateIdHighWater).toBe(2);
  });
});
