/**
 * POST /api/journeys/initialize: server backstop for category/candidate alignment and
 * the S1 tier rules.
 *
 * Risks:
 *  - a candidate of another category (stale active candidate) produced a stray row
 *    such as `ir5_candidate3`, or loaded another candidate's journey;
 *  - the roster tier and the legacy stored journeyTiers map (both client-writable) were
 *    copied onto the journey row as a paid tier with the user's own session.
 * The user client runs with the 20261113_01 guard model; tiers may only change through
 * the service-role client after Stripe confirms a live plan.
 */

import { createFakeSupabase, type Row } from "./fakeSupabase";

// A fresh user per test: the route keeps a per-user cache of unconfirmed tier hints.
let USER = { id: "user-0" };
let userSeq = 0;
let tables: Record<string, Row[]>;
let userClient: ReturnType<typeof createFakeSupabase>;
let adminClient: ReturnType<typeof createFakeSupabase>;

jest.mock("@/lib/encryption", () => ({ decrypt: (v: string) => v, encrypt: (v: string) => v }));
jest.mock("next/server", () => ({ ...jest.requireActual("next/server"), after: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: async () => userClient }));
jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: new Proxy({}, { get: (_t, p) => (adminClient as any)[p] }),
}));
jest.mock("@/lib/journey/data-access", () => ({
  getAllJourneysDB: async (_x: unknown, c: any) => tables.journeys.filter((j) => j.user_id === c.user.id).map((j) => ({ ...j })),
  getJourneyDB: async (id: string) => ({ ...tables.journeys.find((j) => j.id === id) }),
  getStepsForJourneyDB: async () => [{ step_key: "s1", id: "step-1", status: "pending" }],
  getCaseDataForJourneyDB: async () => [],
  getChaptersForJourneyDB: async () => [],
}));
const mockSeed = jest.fn();
jest.mock("@/lib/journey/service", () => ({
  journeyService: { createJourneyFromConfig: (...a: any[]) => mockSeed(...a) },
}));
const mockSubsList = jest.fn();
jest.mock("@/lib/stripe/config", () => ({
  stripe: { subscriptions: { list: (...a: any[]) => mockSubsList(...a) } },
  STRIPE_PRICES: {},
}));

import { POST } from "@/app/api/journeys/initialize/route";

const ROSTER = [
  { id: "candidate-1", relation: "Mother", visaCategory: "IR-5", tier: "premium" },
  { id: "candidate-2", relation: "Father", visaCategory: "IR-5", tier: "free" },
  { id: "candidate-3", relation: "Child", visaCategory: "IR-2", categorySlot: 1, tier: "free" },
];

let reqSeq = 0;
function call(body: Row) {
  // A unique journey_db_id-free cache key per test: bust the 30s server cache.
  reqSeq++;
  return POST(
    new Request("http://localhost/api/journeys/initialize", {
      method: "POST",
      headers: { "x-cache-bust": "1" },
      body: JSON.stringify(body),
    }) as any
  );
}

function setup(journeys: Row[], roster: any[] = ROSTER, details: Row = {}, customer: string | null = null) {
  USER = { id: `user-${++userSeq}` };
  tables = {
    journeys: journeys.map((j) => ({ user_id: USER.id, stripe_subscription_id: null, completed_steps_count: 0, ...j })),
    user_profiles: [
      { id: USER.id, stripe_customer_id: customer, profile_details: { candidates: roster, ...details } },
    ],
  };
  userClient = createFakeSupabase(tables, { user: USER, guard: true });
  adminClient = createFakeSupabase(tables);
  mockSeed.mockReset();
  mockSeed.mockImplementation(async (_p: string, o: any) => {
    const row = { id: `seed-${o.journey_type}`, user_id: USER.id, journey_type: o.journey_type, subscription_tier: "free", stripe_subscription_id: null };
    tables.journeys.push(row);
    return { journey: { id: row.id } };
  });
  mockSubsList.mockReset();
  mockSubsList.mockResolvedValue({ data: [] });
}

const types = () => tables.journeys.map((j) => j.journey_type).sort();

describe("initialize resolves the candidate inside the URL category", () => {
  it("an IR-5 parent sent with the IR-2 URL loads the IR-2 base journey and creates nothing", async () => {
    setup([
      { id: "j-ir5", journey_type: "ir5", subscription_tier: "premium" },
      { id: "j-ir2", journey_type: "ir2", subscription_tier: "basic", completed_steps_count: 3 },
    ]);
    const res = await call({ journey_type: "ir-2", candidate_id: "candidate-2" });
    const body = await res.json();
    expect(body.data.journey.id).toBe("j-ir2");
    expect(types()).toEqual(["ir2", "ir5"]);
  });

  it("an IR-2 child sent with the IR-5 URL never creates ir5_candidate3", async () => {
    setup([{ id: "j-ir5", journey_type: "ir5", subscription_tier: "premium" }]);
    const body = await (await call({ journey_type: "ir-5", candidate_id: "candidate-3" })).json();
    expect(body.data.journey.id).toBe("j-ir5");
    expect(types()).toEqual(["ir5"]);
  });

  it("the IR-2 child (candidate-3, slot 1) loads ir2, not ir2_candidate3", async () => {
    setup([
      { id: "j-ir2", journey_type: "ir2", subscription_tier: "premium" },
      { id: "j-ir2c3", journey_type: "ir2_candidate3", subscription_tier: "executive" },
    ]);
    const body = await (await call({ journey_type: "ir-2", candidate_id: "candidate-3" })).json();
    expect(body.data.journey.id).toBe("j-ir2");
  });

  it("a journeyId for another candidate's row is ignored", async () => {
    setup([
      { id: "j-ir5", journey_type: "ir5", subscription_tier: "premium" },
      { id: "j-ir5c2", journey_type: "ir5_candidate2", subscription_tier: "basic" },
    ]);
    const body = await (
      await call({ journey_type: "ir-5", candidate_id: "candidate-1", journey_db_id: "j-ir5c2" })
    ).json();
    expect(body.data.journey.id).toBe("j-ir5");
  });
});

describe("initialize never grants a tier from client-writable data", () => {
  it("a forged roster tier does not upgrade the row when Stripe has no plan", async () => {
    const forged = ROSTER.map((c) => (c.id === "candidate-3" ? { ...c, tier: "executive" } : c));
    setup([{ id: "j-ir2", journey_type: "ir2", subscription_tier: "free", completed_steps_count: 2 }], forged, {}, "cus_1");
    const body = await (await call({ journey_type: "ir-2", candidate_id: "candidate-3" })).json();
    expect(body.data.journey.subscription_tier).toBe("free");
    expect(tables.journeys.find((j) => j.id === "j-ir2")?.subscription_tier).toBe("free");
  });

  it("a stored journeyTiers entry does not grant access and creates no row", async () => {
    setup([], ROSTER, { journeyTiers: { ir2: "premium", "IR-2": "premium" } }, "cus_1");
    const body = await (await call({ journey_type: "ir-2", candidate_id: "candidate-3" })).json();
    expect(body.data.journey).toMatchObject({ id: null, subscription_tier: "free" });
    expect(tables.journeys).toHaveLength(0);
  });

  it("no Stripe customer means no Stripe call and no tier", async () => {
    const forged = ROSTER.map((c) => (c.id === "candidate-3" ? { ...c, tier: "premium" } : c));
    setup([], forged, {}, null);
    await call({ journey_type: "ir-2", candidate_id: "candidate-3" });
    expect(mockSubsList).not.toHaveBeenCalled();
    expect(tables.journeys).toHaveLength(0);
  });

  it("a direct user-session tier write is ignored by the guard (model of the trigger)", async () => {
    setup([{ id: "j-ir2", journey_type: "ir2", subscription_tier: "free" }]);
    await userClient.from("journeys").update({ subscription_tier: "executive", stripe_subscription_id: "sub_fake" }).eq("id", "j-ir2");
    expect(tables.journeys[0]).toMatchObject({ subscription_tier: "free", stripe_subscription_id: null });
  });
});

describe("Stripe-verified repair (service role)", () => {
  const sub = (over: Row = {}) => ({
    id: "sub_ir2",
    status: "active",
    metadata: { visa_category: "IR-2", tier: "premium", candidate_id: "candidate-3" },
    items: { data: [] },
    ...over,
  });

  it("a live plan for this candidate repairs the row through the admin client", async () => {
    const hinted = ROSTER.map((c) => (c.id === "candidate-3" ? { ...c, tier: "premium" } : c));
    setup([], hinted, {}, "cus_1");
    mockSubsList.mockResolvedValue({ data: [sub()] });
    const body = await (await call({ journey_type: "ir-2", candidate_id: "candidate-3" })).json();
    expect(body.data.journey.subscription_tier).toBe("premium");
    expect(tables.journeys.find((j) => j.journey_type === "ir2")).toMatchObject({
      subscription_tier: "premium",
      stripe_subscription_id: "sub_ir2",
    });
  });

  it("a plan tagged for another candidate does not repair this one", async () => {
    const hinted = ROSTER.map((c) => (c.id === "candidate-3" ? { ...c, tier: "premium" } : c));
    setup([], hinted, {}, "cus_1");
    mockSubsList.mockResolvedValue({ data: [sub({ metadata: { visa_category: "IR-2", tier: "premium", candidate_id: "candidate-9" } })] });
    await call({ journey_type: "ir-2", candidate_id: "candidate-3" });
    expect(tables.journeys).toHaveLength(0);
  });

  it("a plan already attached to another journey row is not borrowed", async () => {
    const hinted = ROSTER.map((c) => (c.id === "candidate-2" ? { ...c, tier: "premium" } : c));
    setup(
      [
        { id: "j-ir5", journey_type: "ir5", subscription_tier: "premium", stripe_subscription_id: "sub_ir5" },
        { id: "j-ir5c2", journey_type: "ir5_candidate2", subscription_tier: "free", completed_steps_count: 1 },
      ],
      hinted,
      {},
      "cus_1"
    );
    mockSubsList.mockResolvedValue({
      data: [sub({ id: "sub_ir5", metadata: { visa_category: "IR-5", tier: "premium" } })],
    });
    await call({ journey_type: "ir-5", candidate_id: "candidate-2" });
    expect(tables.journeys.find((j) => j.id === "j-ir5c2")?.subscription_tier).toBe("free");
  });
});
