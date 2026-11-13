/**
 * POST /api/candidate/create and /api/candidate/delete.
 *
 * The user's session client runs with the 20261113_01 guard model (an `authenticated`
 * write cannot change journeys billing columns or server-owned profile keys); the admin
 * client writes the same tables unguarded, as service_role does. So these tests also show
 * that the roster writes go through the service-role path, not the guarded one.
 */

import { createFakeSupabase, type Row } from "./fakeSupabase";

const USER = { id: "user-1" };
let tables: Record<string, Row[]>;
let userClient: ReturnType<typeof createFakeSupabase>;
let adminClient: ReturnType<typeof createFakeSupabase>;

jest.mock("@/lib/supabase/server", () => ({
  createClient: async () => userClient,
}));
jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: new Proxy({}, { get: (_t, p) => (adminClient as any)[p] }),
}));
const mockSeed = jest.fn();
jest.mock("@/lib/journey/service", () => ({
  journeyService: { createJourneyFromConfig: (...a: any[]) => mockSeed(...a) },
}));

import { POST as createPOST } from "@/app/api/candidate/create/route";
import { handleCandidateDelete } from "@/lib/candidate/deleteCandidate";

function req(body: unknown): Request {
  return new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body) });
}

function profile(): Row {
  return tables.user_profiles[0].profile_details;
}

function setup(roster: any[], journeys: Row[] = [], extra: Row = {}, drafts: Row[] = []) {
  tables = {
    user_profiles: [{ id: USER.id, profile_details: { candidates: roster, ...extra } }],
    journeys: journeys.map((j) => ({ user_id: USER.id, stripe_subscription_id: null, ...j })),
    visa_forms_draft: drafts.map((d) => ({ user_id: USER.id, form_code: "i130", ...d })),
    user_guides: [],
  };
  userClient = createFakeSupabase(tables, { user: USER, guard: true });
  adminClient = createFakeSupabase(tables);
  mockSeed.mockReset();
  mockSeed.mockImplementation(async (_p: string, o: any) => {
    const row = { id: `seed-${o.journey_type}`, user_id: USER.id, journey_type: o.journey_type, subscription_tier: "free" };
    tables.journeys.push(row);
    return { journey: { id: row.id } };
  });
}

const IR5_PARENTS = [
  { id: "candidate-1", relation: "Mother", visaCategory: "IR-5", tier: "premium", isPrimary: true, label: "Candidate 1" },
  { id: "candidate-2", relation: "Father", visaCategory: "IR-5", tier: "free", isPrimary: false, label: "Candidate 2" },
];

describe("candidate/create assigns identity on the server", () => {
  it("an IR-2 child added after two IR-5 parents is candidate-3, IR-2 slot 1, journey ir2", async () => {
    setup(IR5_PARENTS);
    const res = await createPOST(req({ candidate: { relation: "Child", visaCategory: "IR-2" } }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.candidate).toMatchObject({
      id: "candidate-3",
      categorySlot: 1,
      label: "Candidate 1",
      visaCategory: "IR-2",
      tier: "free",
      isPrimary: false,
    });
    expect(body.journeyKey).toBe("ir2");
    expect(profile().candidates).toHaveLength(3);
  });

  it("ignores a forged id, slot, tier, label, preview and primary flag", async () => {
    setup(IR5_PARENTS);
    const res = await createPOST(
      req({
        candidate: {
          id: "candidate-1",
          relation: "Child",
          visaCategory: "IR-2",
          tier: "executive",
          categorySlot: 7,
          label: "Anything",
          isPrimary: true,
          isPreview: true,
        },
      })
    );
    const body = await res.json();
    expect(body.candidate).toMatchObject({
      id: "candidate-3",
      categorySlot: 1,
      tier: "free",
      label: "Candidate 1",
      isPrimary: false,
      isPreview: false,
    });
    // candidate-1 was not overwritten by the forged id.
    expect(profile().candidates[0]).toMatchObject({ id: "candidate-1", relation: "Mother", tier: "premium" });
  });

  it("the second IR-2 child is candidate-4 on ir2_candidate2", async () => {
    setup([...IR5_PARENTS, { id: "candidate-3", relation: "Child", visaCategory: "IR-2", categorySlot: 1, tier: "free" }]);
    const body = await (await createPOST(req({ candidate: { relation: "Child" } }))).json();
    expect(body.candidate).toMatchObject({ id: "candidate-4", categorySlot: 2 });
    expect(body.journeyKey).toBe("ir2_candidate2");
  });

  it("never reissues a deleted id and records the high-water mark", async () => {
    setup([IR5_PARENTS[0]], [], { candidateIdHighWater: 2 });
    const body = await (await createPOST(req({ candidate: { relation: "Father" } }))).json();
    expect(body.candidate.id).toBe("candidate-3");
    expect(profile().candidateIdHighWater).toBe(3);
  });

  it("an id still used by candidate-tagged rows is not reissued", async () => {
    setup([IR5_PARENTS[0]]);
    tables.user_guides.push({ user_id: USER.id, candidate_id: "candidate-6" });
    const body = await (await createPOST(req({ candidate: { relation: "Father" } }))).json();
    expect(body.candidate.id).toBe("candidate-7");
  });

  it.each([
    ["a journey row", { journeys: [{ id: "old", journey_type: "ir5_candidate2", subscription_tier: "free" }] }],
    ["a form draft", { drafts: [{ journey_key: "ir5_candidate2" }] }],
    ["a stored journeyTiers entry", { extra: { journeyTiers: { ir5_candidate2: "free" } } }],
    ["a journeyCustomizations entry", { extra: { journeyCustomizations: { ir5_candidate2: { name: "Dad" } } } }],
  ])("does not reuse slot 2 while %s is left behind", async (_label, left: any) => {
    setup([IR5_PARENTS[0]], left.journeys ?? [], left.extra ?? {}, left.drafts ?? []);
    const body = await (await createPOST(req({ candidate: { relation: "Father" } }))).json();
    expect(body.candidate.categorySlot).toBe(3);
    expect(body.journeyKey).toBe("ir5_candidate3");
  });

  it("refuses a second spouse", async () => {
    setup([{ id: "candidate-1", relation: "Spouse", visaCategory: "IR-1", tier: "free" }]);
    const res = await createPOST(req({ candidate: { relation: "Spouse" } }));
    expect(res.status).toBe(409);
  });

  it("refuses a category that does not match the relation", async () => {
    setup(IR5_PARENTS);
    const res = await createPOST(req({ candidate: { relation: "Child", visaCategory: "IR-5" } }));
    expect(res.status).toBe(400);
  });

  it("fails closed (503) when existing journey data cannot be checked", async () => {
    setup(IR5_PARENTS);
    userClient = createFakeSupabase(tables, { user: USER, guard: true, failTables: ["visa_forms_draft"] });
    const res = await createPOST(req({ candidate: { relation: "Father" } }));
    expect(res.status).toBe(503);
    expect(profile().candidates).toHaveLength(2);
  });
});

describe("candidate/create updates only editable fields", () => {
  it("a forged tier / slot / category on update is ignored", async () => {
    setup(IR5_PARENTS);
    const res = await createPOST(
      req({
        action: "update",
        candidateId: "candidate-2",
        updates: { fullName: "John", tier: "executive", categorySlot: 1, visaCategory: "IR-2", isPrimary: true },
      })
    );
    expect(res.status).toBe(200);
    expect(profile().candidates[1]).toMatchObject({
      fullName: "John",
      tier: "free",
      visaCategory: "IR-5",
      isPrimary: false,
    });
    expect(profile().candidates[1].categorySlot).toBeUndefined();
  });

  it("a create carrying an existing id never touches that candidate", async () => {
    setup(IR5_PARENTS);
    await createPOST(req({ candidate: { id: "candidate-2", relation: "Father", tier: "executive", fullName: "J" } }));
    expect(profile().candidates).toHaveLength(3);
    expect(profile().candidates[1]).toEqual(IR5_PARENTS[1]);
    expect(profile().candidates[2]).toMatchObject({ id: "candidate-3", tier: "free", fullName: "J" });
  });

  it("refuses moving a candidate to another category through its relation", async () => {
    setup(IR5_PARENTS);
    const res = await createPOST(
      req({ action: "update", candidateId: "candidate-2", updates: { relation: "Child" } })
    );
    expect(res.status).toBe(400);
  });
});

describe("candidate/delete rules", () => {
  const liveNever = jest.fn(async () => false);

  const MIXED = [
    ...IR5_PARENTS,
    { id: "candidate-3", relation: "Child", visaCategory: "IR-2", categorySlot: 1, tier: "free" },
    { id: "candidate-4", relation: "Child", visaCategory: "IR-2", categorySlot: 2, tier: "premium" },
  ];
  const MIXED_ROWS = [
    { id: "j-ir5", journey_type: "ir5", subscription_tier: "premium", stripe_subscription_id: "sub_a" },
    { id: "j-ir5c2", journey_type: "ir5_candidate2", subscription_tier: "free" },
    { id: "j-ir2", journey_type: "ir2", subscription_tier: "free" },
    { id: "j-ir2c2", journey_type: "ir2_candidate2", subscription_tier: "premium", stripe_subscription_id: "sub_child" },
  ];

  it("candidate-1 can never be deleted", async () => {
    setup(MIXED, MIXED_ROWS);
    const res = await handleCandidateDelete(req({ candidateId: "candidate-1" }), liveNever);
    expect(res.status).toBe(400);
  });

  it("a candidate with a paid journey cannot be deleted", async () => {
    setup(MIXED, MIXED_ROWS);
    const res = await handleCandidateDelete(req({ candidateId: "candidate-4" }), liveNever);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error).toBe("Cancel this candidate's plan before removing them.");
    expect(tables.journeys.find((j) => j.id === "j-ir2c2")).toBeDefined();
  });

  it("a free row still attached to a live Stripe subscription cannot be deleted", async () => {
    const rows = MIXED_ROWS.map((r) => (r.id === "j-ir5c2" ? { ...r, stripe_subscription_id: "sub_live" } : r));
    setup(MIXED, rows);
    const res = await handleCandidateDelete(req({ candidateId: "candidate-2" }), async () => true);
    expect(res.status).toBe(409);
  });

  it("fails closed when Stripe cannot confirm the subscription", async () => {
    const rows = MIXED_ROWS.map((r) => (r.id === "j-ir5c2" ? { ...r, stripe_subscription_id: "sub_x" } : r));
    setup(MIXED, rows);
    // The default check treats any Stripe error other than "no such subscription" as live.
    const unreachable = jest.fn(async () => true);
    const res = await handleCandidateDelete(req({ candidateId: "candidate-2" }), unreachable);
    expect(res.status).toBe(409);
    expect(unreachable).toHaveBeenCalledWith("sub_x");
  });

  it("the first candidate of a category cannot be deleted while others remain in it", async () => {
    setup(MIXED, MIXED_ROWS);
    const res = await handleCandidateDelete(req({ candidateId: "candidate-3" }), liveNever);
    expect(res.status).toBe(409);
  });

  it("the sole, free candidate of a category can be deleted", async () => {
    const roster = [...IR5_PARENTS, { id: "candidate-3", relation: "Child", visaCategory: "IR-2", categorySlot: 1, tier: "free" }];
    setup(roster, [{ id: "j-ir2", journey_type: "ir2", subscription_tier: "free" }]);
    const res = await handleCandidateDelete(req({ candidateId: "candidate-3" }), liveNever);
    expect(res.status).toBe(200);
    expect(tables.journeys).toHaveLength(0);
  });

  it("deleting IR-5 candidate 2 leaves every IR-2 candidate-2 record byte-identical", async () => {
    const extra = {
      journeyCustomizations: {
        "candidate-2": { name: "Dad" },
        ir5_candidate2: { name: "Dad" },
        "j-ir5c2": { name: "Dad" },
        ir2_candidate2: { name: "Kid" },
        "candidate-4": { name: "Kid" },
        "j-ir2c2": { name: "Kid" },
      },
      journeyTiers: { ir5_candidate2: "free", ir2_candidate2: "premium" },
    };
    setup(MIXED, MIXED_ROWS, extra, [{ journey_key: "ir5_candidate2" }, { journey_key: "ir2_candidate2" }]);
    tables.user_guides.push(
      { user_id: USER.id, candidate_id: "candidate-2", guide_id: "g" },
      { user_id: USER.id, candidate_id: "candidate-4", guide_id: "g" }
    );
    const childRowBefore = JSON.stringify(tables.journeys.find((j) => j.id === "j-ir2c2"));
    const childRosterBefore = JSON.stringify(MIXED[3]);
    const liveCheck = jest.fn(async () => false);

    const res = await handleCandidateDelete(req({ candidateId: "candidate-2" }), liveCheck);
    expect(res.status).toBe(200);

    // IR-2 candidate 2: row (tier + stripe id), drafts, customizations, tier entry, guides.
    expect(JSON.stringify(tables.journeys.find((j) => j.id === "j-ir2c2"))).toBe(childRowBefore);
    expect(JSON.stringify(profile().candidates.find((c: any) => c.id === "candidate-4"))).toBe(childRosterBefore);
    expect(tables.visa_forms_draft.map((d) => d.journey_key)).toEqual(["ir2_candidate2"]);
    expect(profile().journeyCustomizations).toEqual({
      ir2_candidate2: { name: "Kid" },
      "candidate-4": { name: "Kid" },
      "j-ir2c2": { name: "Kid" },
    });
    expect(profile().journeyTiers).toEqual({ ir2_candidate2: "premium" });
    expect(tables.user_guides.map((g) => g.candidate_id)).toEqual(["candidate-4"]);

    // IR-5 candidate 2 is gone everywhere, and nothing was asked of Stripe.
    expect(tables.journeys.find((j) => j.id === "j-ir5c2")).toBeUndefined();
    expect(profile().candidates.map((c: any) => c.id)).toEqual(["candidate-1", "candidate-3", "candidate-4"]);
    expect(liveCheck).not.toHaveBeenCalled();
    expect(profile().candidateIdHighWater).toBe(4);
  });

  it("after a delete, the next candidate gets a new id and the freed slot", async () => {
    setup(IR5_PARENTS, [{ id: "j-ir5c2", journey_type: "ir5_candidate2", subscription_tier: "free" }]);
    await handleCandidateDelete(req({ candidateId: "candidate-2" }), liveNever);
    const body = await (await createPOST(req({ candidate: { relation: "Father" } }))).json();
    expect(body.candidate).toMatchObject({ id: "candidate-3", categorySlot: 2 });
    expect(body.journeyKey).toBe("ir5_candidate2");
  });
});
